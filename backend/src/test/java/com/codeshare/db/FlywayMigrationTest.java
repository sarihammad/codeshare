package com.codeshare.db;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

  @Autowired private DataSource dataSource;

  @Autowired private JdbcTemplate jdbcTemplate;

  @Test
  void testFlywayMigrationsApplied() {
    // Verify that Flyway migrations have been applied
    Flyway flyway = Flyway.configure().dataSource(dataSource).load();

    // Check that migrations have been applied
    assertTrue(flyway.info().applied().length > 0, "At least one migration should be applied");
  }

  @Test
  void testDatabaseSchemaExists() {
    // Verify that the expected tables exist
    List<Map<String, Object>> tables =
        jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");

    List<String> tableNames =
        tables.stream().map(table -> (String) table.get("table_name")).toList();

    assertTrue(tableNames.contains("users"), "Users table should exist");
    assertTrue(tableNames.contains("rooms"), "Rooms table should exist");
    assertTrue(tableNames.contains("room_members"), "Room_members table should exist");
  }

  @Test
  void testUsersTableStructure() {
    // Verify users table structure
    List<Map<String, Object>> columns =
        jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                + "WHERE table_name = 'users' AND table_schema = 'public'");

    List<String> columnNames =
        columns.stream().map(col -> (String) col.get("column_name")).toList();

    assertTrue(columnNames.contains("id"), "Users table should have id column");
    assertTrue(columnNames.contains("email"), "Users table should have email column");
    assertTrue(columnNames.contains("password"), "Users table should have password column");
    assertTrue(columnNames.contains("role"), "Users table should have role column");
    assertTrue(columnNames.contains("created_at"), "Users table should have created_at column");
    assertTrue(columnNames.contains("updated_at"), "Users table should have updated_at column");
  }

  @Test
  void testRoomsTableStructure() {
    // Verify rooms table structure
    List<Map<String, Object>> columns =
        jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                + "WHERE table_name = 'rooms' AND table_schema = 'public'");

    List<String> columnNames =
        columns.stream().map(col -> (String) col.get("column_name")).toList();

    assertTrue(columnNames.contains("id"), "Rooms table should have id column");
    assertTrue(columnNames.contains("name"), "Rooms table should have name column");
    assertTrue(columnNames.contains("owner_id"), "Rooms table should have owner_id column");
    assertTrue(columnNames.contains("language"), "Rooms table should have language column");
    assertTrue(columnNames.contains("created_at"), "Rooms table should have created_at column");
    assertTrue(columnNames.contains("updated_at"), "Rooms table should have updated_at column");
  }

  @Test
  void testRoomMembersTableStructure() {
    // Verify room_members table structure
    List<Map<String, Object>> columns =
        jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                + "WHERE table_name = 'room_members' AND table_schema = 'public'");

    List<String> columnNames =
        columns.stream().map(col -> (String) col.get("column_name")).toList();

    assertTrue(columnNames.contains("room_id"), "Room_members table should have room_id column");
    assertTrue(
        columnNames.contains("member_id"), "Room_members table should have member_id column");
  }

  @Test
  void testIndexesExist() {
    // Verify that indexes exist
    List<Map<String, Object>> indexes =
        jdbcTemplate.queryForList("SELECT indexname FROM pg_indexes WHERE schemaname = 'public'");

    List<String> indexNames = indexes.stream().map(idx -> (String) idx.get("indexname")).toList();

    assertTrue(
        indexNames.stream().anyMatch(name -> name.contains("users_email")),
        "Users email index should exist");
    assertTrue(
        indexNames.stream().anyMatch(name -> name.contains("rooms_owner_id")),
        "Rooms owner_id index should exist");
    assertTrue(
        indexNames.stream().anyMatch(name -> name.contains("room_members_room_id")),
        "Room_members room_id index should exist");
    assertTrue(
        indexNames.stream().anyMatch(name -> name.contains("room_members_member_id")),
        "Room_members member_id index should exist");
  }

  @Test
  void testTriggersExist() {
    // Verify that triggers exist
    List<Map<String, Object>> triggers =
        jdbcTemplate.queryForList(
            "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'");

    List<String> triggerNames =
        triggers.stream().map(trigger -> (String) trigger.get("trigger_name")).toList();

    assertTrue(
        triggerNames.contains("update_users_updated_at"), "Users updated_at trigger should exist");
    assertTrue(
        triggerNames.contains("update_rooms_updated_at"), "Rooms updated_at trigger should exist");
  }
}
