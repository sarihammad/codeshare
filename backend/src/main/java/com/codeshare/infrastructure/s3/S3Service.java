package com.codeshare.infrastructure.s3;

import com.amazonaws.auth.EnvironmentVariableCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ListObjectsV2Request;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3ObjectSummary;
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

  public S3Service(
      @Value("${s3.region}") String region, @Value("${s3.enabled:false}") boolean enabled) {
    this.s3Enabled = enabled && isS3Configured();
    if (s3Enabled) {
      this.s3 =
          AmazonS3ClientBuilder.standard()
              .withRegion(Regions.fromName(region))
              .withCredentials(new EnvironmentVariableCredentialsProvider())
              .build();
      logger.info("S3 service initialized successfully");
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

  public void save(String key, String content) {
    if (!s3Enabled) {
      logger.debug("S3 not configured, skipping save for key: {}", key);
      return;
    }

    try {
      byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
      ObjectMetadata metadata = new ObjectMetadata();
      metadata.setContentLength(bytes.length);

      s3.putObject(bucket, key, new ByteArrayInputStream(bytes), metadata);
      logger.debug("Successfully saved content to S3 with key: {}", key);
    } catch (Exception e) {
      logger.error("Failed to save content to S3 with key {}: {}", key, e.getMessage());
      throw new RuntimeException("Failed to save to S3", e);
    }
  }

  public void uploadSnapshot(String key, String content) {
    save(key, content);
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
