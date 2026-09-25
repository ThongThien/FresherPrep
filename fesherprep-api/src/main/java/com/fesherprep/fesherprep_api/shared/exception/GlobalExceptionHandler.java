package com.fesherprep.fesherprep_api.shared.exception;

import com.fesherprep.fesherprep_api.knowledge.service.DuplicateKnowledgeSlugException;
import com.fesherprep.fesherprep_api.knowledge.service.KnowledgeNodeNotFoundException;
import com.fesherprep.fesherprep_api.lesson.service.DuplicateLessonSlugException;
import com.fesherprep.fesherprep_api.lesson.service.LessonAssessmentNotFoundException;
import com.fesherprep.fesherprep_api.lesson.service.LessonNotFoundException;
import com.fesherprep.fesherprep_api.learningpath.service.LearningPathNotFoundException;
import com.fesherprep.fesherprep_api.question.service.DuplicateQuestionCodeException;
import com.fesherprep.fesherprep_api.question.service.QuestionNotFoundException;
import com.fesherprep.fesherprep_api.question.service.QuestionVersionNotFoundException;
import com.fesherprep.fesherprep_api.quiz.service.DuplicateQuizCodeException;
import com.fesherprep.fesherprep_api.quiz.service.InsufficientQuizQuestionsException;
import com.fesherprep.fesherprep_api.quiz.service.QuizAttemptNotFoundException;
import com.fesherprep.fesherprep_api.quiz.service.QuizNotFoundException;
import com.fesherprep.fesherprep_api.shared.dto.ApiErrorResponse;
import com.fesherprep.fesherprep_api.user.service.EmailAlreadyUsedException;
import com.fesherprep.fesherprep_api.user.service.UserNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            KnowledgeNodeNotFoundException.class,
            LessonNotFoundException.class,
            LessonAssessmentNotFoundException.class,
            LearningPathNotFoundException.class,
            QuestionNotFoundException.class,
            QuestionVersionNotFoundException.class,
            QuizNotFoundException.class,
            QuizAttemptNotFoundException.class,
            UserNotFoundException.class
    })
    public ResponseEntity<ApiErrorResponse> handleNotFound(RuntimeException exception) {
        return response(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler({
            EmailAlreadyUsedException.class,
            DuplicateKnowledgeSlugException.class,
            DuplicateLessonSlugException.class,
            DuplicateQuestionCodeException.class,
            DuplicateQuizCodeException.class
    })
    public ResponseEntity<ApiErrorResponse> handleDuplicate(RuntimeException exception) {
        return response(HttpStatus.CONFLICT, "DATA_CONFLICT", exception.getMessage());
    }

    @ExceptionHandler(InsufficientQuizQuestionsException.class)
    public ResponseEntity<ApiErrorResponse> handleInsufficientQuizQuestions(
            InsufficientQuizQuestionsException exception
    ) {
        return response(HttpStatus.CONFLICT, "INVALID_STATE", exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidArgument(IllegalArgumentException exception) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidState(IllegalStateException exception) {
        return response(HttpStatus.CONFLICT, "INVALID_STATE", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.validation(fieldErrors(exception.getBindingResult())));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintValidation(ConstraintViolationException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation -> errors.putIfAbsent(
                violation.getPropertyPath().toString(),
                violation.getMessage()
        ));
        return ResponseEntity.badRequest().body(ApiErrorResponse.validation(errors));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.validation(
                Map.of(exception.getName(), "Value has an invalid type or format")
        ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException exception
    ) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.validation(
                Map.of(exception.getParameterName(), "Required parameter is missing")
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableBody(HttpMessageNotReadableException exception) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Request body is missing or malformed");
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handleConcurrentUpdate(
            ObjectOptimisticLockingFailureException exception
    ) {
        return response(
                HttpStatus.CONFLICT,
                "CONCURRENT_MODIFICATION",
                "Resource was modified by another request; reload and try again"
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException exception) {
        String sqlState = findSqlState(exception);
        if ("23505".equals(sqlState) || "23503".equals(sqlState)) {
            return response(
                    HttpStatus.CONFLICT,
                    "DATA_CONFLICT",
                    "Request conflicts with existing or referenced data"
            );
        }
        return response(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "Request violates a data constraint"
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException exception) {
        return response(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication is required or invalid");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException exception) {
        return response(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access is denied");
    }

    private static Map<String, String> fieldErrors(BindingResult bindingResult) {
        Map<String, String> errors = new LinkedHashMap<>();
        bindingResult.getFieldErrors().forEach(error -> errors.putIfAbsent(
                error.getField(),
                error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage()
        ));
        bindingResult.getGlobalErrors().forEach(error -> errors.putIfAbsent(
                error.getObjectName(),
                error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage()
        ));
        return errors;
    }

    private static String findSqlState(Throwable throwable) {
        for (Throwable current = throwable; current != null; current = current.getCause()) {
            if (current instanceof SQLException sqlException && sqlException.getSQLState() != null) {
                return sqlException.getSQLState();
            }
        }
        return null;
    }

    private static ResponseEntity<ApiErrorResponse> response(
            HttpStatus status,
            String code,
            String message
    ) {
        return ResponseEntity.status(status).body(ApiErrorResponse.of(status, code, message));
    }
}
