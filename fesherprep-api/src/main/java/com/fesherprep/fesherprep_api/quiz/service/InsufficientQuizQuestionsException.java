package com.fesherprep.fesherprep_api.quiz.service;

public class InsufficientQuizQuestionsException extends RuntimeException {
    public InsufficientQuizQuestionsException(int required, int available) {
        super("Quiz rule requires " + required + " questions but only " + available + " are available");
    }
}
