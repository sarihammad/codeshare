package com.codeshare.web.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ProblemDetail problem = ProblemDetail.builder()
                .type("https://codeshare.com/problems/validation-error")
                .title("Validation Failed")
                .status(HttpStatus.BAD_REQUEST.value())
                .detail("Request validation failed")
                .instance(request.getDescription(false))
                .timestamp(Instant.now())
                .errors(errors)
                .build();

        logger.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        
        ProblemDetail problem = ProblemDetail.builder()
                .type("https://codeshare.com/problems/bad-request")
                .title("Bad Request")
                .status(HttpStatus.BAD_REQUEST.value())
                .detail(ex.getMessage())
                .instance(request.getDescription(false))
                .timestamp(Instant.now())
                .build();

        logger.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ProblemDetail> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        
        ProblemDetail problem = ProblemDetail.builder()
                .type("https://codeshare.com/problems/internal-error")
                .title("Internal Server Error")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .detail("An unexpected error occurred")
                .instance(request.getDescription(false))
                .timestamp(Instant.now())
                .build();

        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGenericException(
            Exception ex, WebRequest request) {
        
        ProblemDetail problem = ProblemDetail.builder()
                .type("https://codeshare.com/problems/internal-error")
                .title("Internal Server Error")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .detail("An unexpected error occurred")
                .instance(request.getDescription(false))
                .timestamp(Instant.now())
                .build();

        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
