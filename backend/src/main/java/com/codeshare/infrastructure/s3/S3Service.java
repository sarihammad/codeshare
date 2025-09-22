package com.codeshare.infrastructure.s3;

import com.amazonaws.auth.EnvironmentVariableCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.*;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class S3Service {
  private static final Logger logger = LoggerFactory.getLogger(S3Service.class);

  private final AmazonS3 s3;
  private final boolean s3Enabled;

  @Value("${s3.bucket}")
  private String bucket;

  @Value("${s3.encryption:sse-s3}")
  private String encryptionType;

  public S3Service(
      @Value("${s3.region}") String region, @Value("${s3.enabled:false}") boolean enabled) {
    this.s3Enabled = enabled && isS3Configured();
    if (s3Enabled) {
      this.s3 =
          AmazonS3ClientBuilder.standard()
              .withRegion(Regions.fromName(region))
              .withCredentials(new EnvironmentVariableCredentialsProvider())
              .build();

      // Setup bucket lifecycle policy
      setupLifecyclePolicy();

      logger.info("S3 service initialized successfully with encryption: {}", encryptionType);
    } else {
      this.s3 = null;
      if (!enabled) {
        logger.info("S3 is disabled in configuration");
      } else {
        logger.warn("S3 is not configured. Snapshots will not be persisted.");
      }
    }
  }

  private boolean isS3Configured() {
    try {
      String awsAccessKey = System.getenv("AWS_ACCESS_KEY_ID");
      String awsSecretKey = System.getenv("AWS_SECRET_ACCESS_KEY");
      return awsAccessKey != null
          && !awsAccessKey.isEmpty()
          && awsSecretKey != null
          && !awsSecretKey.isEmpty();
    } catch (Exception e) {
      logger.warn("Failed to check S3 configuration: {}", e.getMessage());
      return false;
    }
  }

  private void setupLifecyclePolicy() {
    try {
      // Create lifecycle rules for snapshot retention
      LifecycleConfiguration lifecycleConfig = new LifecycleConfiguration();

      // Rule 1: Transition to IA after 30 days, delete after 1 year
      LifecycleRule retentionRule =
          new LifecycleRule()
              .withId("snapshot-retention-policy")
              .withFilter(new LifecycleRuleFilter().withPrefix("snapshots/"))
              .withStatus(LifecycleRule.Enabled)
              .withTransitions(
                  new LifecycleTransition()
                      .withDays(30)
                      .withStorageClass(StorageClass.StandardInfrequentAccess),
                  new LifecycleTransition().withDays(365).withStorageClass(StorageClass.Glacier))
              .withExpirationInDays(1095); // 3 years total retention

      // Rule 2: Delete temporary files after 7 days
      LifecycleRule tempRule =
          new LifecycleRule()
              .withId("temp-files-cleanup")
              .withFilter(new LifecycleRuleFilter().withPrefix("temp/"))
              .withStatus(LifecycleRule.Enabled)
              .withExpirationInDays(7);

      lifecycleConfig.withRules(retentionRule, tempRule);
      s3.setBucketLifecycleConfiguration(bucket, lifecycleConfig);

      logger.info("S3 lifecycle policy configured successfully");
    } catch (Exception e) {
      logger.warn("Failed to setup S3 lifecycle policy: {}", e.getMessage());
    }
  }

  public void save(String key, String content) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, skipping save for key: {}", key);
      return;
    }

    try {
      byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
      ObjectMetadata metadata = new ObjectMetadata();
      metadata.setContentLength(bytes.length);
      metadata.setContentType("application/json");
      metadata.setContentEncoding("utf-8");

      // Add encryption
      if ("sse-s3".equals(encryptionType)) {
        metadata.setSSEAlgorithm(ObjectMetadata.AES_256_SERVER_SIDE_ENCRYPTION);
      } else if ("sse-kms".equals(encryptionType)) {
        metadata.setSSEAlgorithm(ObjectMetadata.AWS_KMS_SERVER_SIDE_ENCRYPTION);
        metadata.setHeader(
            "x-amz-server-side-encryption-aws-kms-key-id", System.getenv("AWS_KMS_KEY_ID"));
      }

      s3.putObject(bucket, key, new ByteArrayInputStream(bytes), metadata);
      logger.debug("Successfully saved content to S3 with key: {}", key);
    } catch (Exception e) {
      logger.error("Failed to save content to S3 with key {}: {}", key, e.getMessage());
      throw new RuntimeException("Failed to save to S3", e);
    }
  }

  public String uploadSnapshot(String roomId, String content) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, skipping snapshot upload for room: {}", roomId);
      return null;
    }

    // Generate deterministic key: snapshots/{roomId}/{timestamp}/{hash}
    String timestamp = Instant.now().toString().substring(0, 19).replace(":", "-");
    String contentHash = String.valueOf(content.hashCode());
    String key = String.format("snapshots/%s/%s/%s.json", roomId, timestamp, contentHash);

    save(key, content);
    logger.info("Snapshot uploaded for room {} with key: {}", roomId, key);
    return key;
  }

  public String uploadSnapshotWithPolicy(String roomId, String content, SnapshotPolicy policy) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, skipping snapshot upload for room: {}", roomId);
      return null;
    }

    String key = generateSnapshotKey(roomId, content, policy);
    save(key, content);
    logger.info("Snapshot uploaded for room {} with policy {} and key: {}", roomId, policy, key);
    return key;
  }

  private String generateSnapshotKey(String roomId, String content, SnapshotPolicy policy) {
    String timestamp = Instant.now().toString().substring(0, 19).replace(":", "-");
    String contentHash = String.valueOf(content.hashCode());

    switch (policy) {
      case HOURLY:
        return String.format("snapshots/hourly/%s/%s/%s.json", roomId, timestamp, contentHash);
      case DAILY:
        return String.format("snapshots/daily/%s/%s/%s.json", roomId, timestamp, contentHash);
      case MANUAL:
        return String.format("snapshots/manual/%s/%s/%s.json", roomId, timestamp, contentHash);
      default:
        return String.format("snapshots/%s/%s/%s.json", roomId, timestamp, contentHash);
    }
  }

  public enum SnapshotPolicy {
    HOURLY,
    DAILY,
    MANUAL
  }

  public String getSnapshot(String key) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, returning empty content for key: {}", key);
      return "";
    }

    try {
      String content = s3.getObjectAsString(bucket, key);
      logger.debug("Successfully retrieved content from S3 with key: {}", key);
      return content;
    } catch (Exception e) {
      logger.debug("Failed to get content from S3 with key {}: {}", key, e.getMessage());
      return "";
    }
  }

  public List<String> listSnapshotsForRoom(String roomId) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, returning empty list for room: {}", roomId);
      return new ArrayList<>();
    }

    try {
      ListObjectsV2Request req =
          new ListObjectsV2Request().withBucketName(bucket).withPrefix(roomId + "/");
      List<String> keys =
          s3.listObjectsV2(req).getObjectSummaries().stream()
              .map(S3ObjectSummary::getKey)
              .collect(Collectors.toList());
      logger.debug("Successfully listed {} snapshots for room: {}", keys.size(), roomId);
      return keys;
    } catch (Exception e) {
      logger.error("Failed to list snapshots for room {}: {}", roomId, e.getMessage());
      return new ArrayList<>();
    }
  }
}
