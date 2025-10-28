package com.proyecto.spring.social_service.controllers;

public class ErrorRespuesta {
    private String error;

    public ErrorRespuesta() {
    }

    public ErrorRespuesta(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

}