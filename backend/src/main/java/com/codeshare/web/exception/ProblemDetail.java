package com.codeshare.web.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetail(
    @JsonProperty("type") String type,
    @JsonProperty("title") String title,
    @JsonProperty("status") Integer status,
    @JsonProperty("detail") String detail,
    @JsonProperty("instance") String instance,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("errors") Map<String, String> errors) {
  public static ProblemDetailBuilder builder() {
    return new ProblemDetailBuilder();
  }

  public static class ProblemDetailBuilder {
    private String type;
    private String title;
    private Integer status;
    private String detail;
    private String instance;
    private Instant timestamp;
    private Map<String, String> errors;

    public ProblemDetailBuilder type(String type) {
      this.type = type;
      return this;
    }

    public ProblemDetailBuilder title(String title) {
      this.title = title;
      return this;
    }

    public ProblemDetailBuilder status(Integer status) {
      this.status = status;
      return this;
    }

    public ProblemDetailBuilder detail(String detail) {
      this.detail = detail;
      return this;
    }

    public ProblemDetailBuilder instance(String instance) {
      this.instance = instance;
      return this;
    }

    public ProblemDetailBuilder timestamp(Instant timestamp) {
      this.timestamp = timestamp;
      return this;
    }

    public ProblemDetailBuilder errors(Map<String, String> errors) {
      this.errors = errors;
      return this;
    }

    public ProblemDetail build() {
      return new ProblemDetail(type, title, status, detail, instance, timestamp, errors);
    }
  }
}
