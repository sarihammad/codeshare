package com.codeshare.database;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("integration")
class MigrationTest {

  @Autowired private DataSource dataSource;

  @Autowired private JdbcTemplate jdbcTemplate;

  @BeforeEach
  void setUp() {
    // Skip tests if using H2 database (test profile with Flyway disabled)
    try {
      String url = dataSource.getConnection().getMetaData().getURL();
      Assumptions.assumeTrue(
          url.contains("postgresql"), "Skipping Migration tests - requires PostgreSQL database");
    } catch (Exception e) {
      Assumptions.assumeTrue(false, "Could not determine database type");
    }
  }

  @Test
  void testUsersTableExists() {
    List<Map<String, Object>> tables =
        jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");

    assertFalse(tables.isEmpty(), "Users table should exist");
  }

  @Test
  void testRoomsTableExists() {
    List<Map<String, Object>> tables =
        jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rooms'");

    assertFalse(tables.isEmpty(), "Rooms table should exist");
  }

  @Test
  void testRoomMembersTableExists() {
    List<Map<String, Object>> tables =
        jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_members'");

    assertFalse(tables.isEmpty(), "Room members table should exist");
  }

  @Test
  void testSnapshotsTableExists() {
    List<Map<String, Object>> tables =
        jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'snapshots'");

    assertFalse(tables.isEmpty(), "Snapshots table should exist");
  }

  @Test
  void testUsersTableStructure() {
    List<Map<String, Object>> columns =
        jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");

    assertFalse(columns.isEmpty(), "Users table should have columns");

    // Check for required columns
    boolean hasId = columns.stream().anyMatch(col -> "id".equals(col.get("column_name")));
    boolean hasEmail = columns.stream().anyMatch(col -> "email".equals(col.get("column_name")));
    boolean hasPasswordHash =
        columns.stream().anyMatch(col -> "password_hash".equals(col.get("column_name")));
    boolean hasCreatedAt =
        columns.stream().anyMatch(col -> "created_at".equals(col.get("column_name")));

    assertTrue(hasId, "Users table should have id column");
    assertTrue(hasEmail, "Users table should have email column");
    assertTrue(hasPasswordHash, "Users table should have password_hash column");
    assertTrue(hasCreatedAt, "Users table should have created_at column");
  }

  @Test
  void testRoomsTableStructure() {
    List<Map<String, Object>> columns =
        jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'rooms' ORDER BY ordinal_position");

    assertFalse(columns.isEmpty(), "Rooms table should have columns");

    // Check for required columns
    boolean hasId = columns.stream().anyMatch(col -> "id".equals(col.get("column_name")));
    boolean hasName = columns.stream().anyMatch(col -> "name".equals(col.get("column_name")));
    boolean hasOwnerId =
        columns.stream().anyMatch(col -> "owner_id".equals(col.get("column_name")));
    boolean hasCreatedAt =
        columns.stream().anyMatch(col -> "created_at".equals(col.get("column_name")));

    assertTrue(hasId, "Rooms table should have id column");
    assertTrue(hasName, "Rooms table should have name column");
    assertTrue(hasOwnerId, "Rooms table should have owner_id column");
    assertTrue(hasCreatedAt, "Rooms table should have created_at column");
  }

  @Test
  void testIndexesExist() {
    // Check for indexes on commonly queried columns
    List<Map<String, Object>> indexes =
        jdbcTemplate.queryForList(
            "SELECT indexname FROM pg_indexes WHERE tablename IN ('users', 'rooms', 'room_members', 'snapshots')");

    assertFalse(indexes.isEmpty(), "Tables should have indexes");

    // Check for specific indexes
    List<String> indexNames =
        indexes.stream().map(index -> (String) index.get("indexname")).toList();

    boolean hasUserEmailIndex = indexNames.stream().anyMatch(name -> name.contains("email"));
    boolean hasRoomOwnerIndex = indexNames.stream().anyMatch(name -> name.contains("owner_id"));

    assertTrue(hasUserEmailIndex, "Should have index on user email");
    assertTrue(hasRoomOwnerIndex, "Should have index on room owner_id");
  }

  @Test
  void testForeignKeysExist() {
    List<Map<String, Object>> foreignKeys =
        jdbcTemplate.queryForList(
            "SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name "
                + "FROM information_schema.table_constraints AS tc "
                + "JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name "
                + "JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name "
                + "WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'");

    assertFalse(foreignKeys.isEmpty(), "Tables should have foreign key constraints");

    // Check for specific foreign keys
    boolean hasRoomOwnerFk =
        foreignKeys.stream()
            .anyMatch(
                fk ->
                    "rooms".equals(fk.get("table_name"))
                        && "owner_id".equals(fk.get("column_name")));
    boolean hasRoomMemberFk =
        foreignKeys.stream()
            .anyMatch(
                fk ->
                    "room_members".equals(fk.get("table_name"))
                        && "room_id".equals(fk.get("column_name")));

    assertTrue(hasRoomOwnerFk, "Rooms should have foreign key to users");
    assertTrue(hasRoomMemberFk, "Room members should have foreign key to rooms");
  }
}
