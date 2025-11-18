package com.proyecto.spring.social_service.controllers;

public class SolicitudAmistadRequest {
    private Long solicitanteId;
    private Long receptorId;

    // Constructor vacío
    public SolicitudAmistadRequest() {
    }

    // Constructor con parámetros
    public SolicitudAmistadRequest(Long solicitanteId, Long receptorId) {
        this.solicitanteId = solicitanteId;
        this.receptorId = receptorId;
    }

    // Getters y Setters
    public Long getSolicitanteId() {
        return solicitanteId;
    }

    public void setSolicitanteId(Long solicitanteId) {
        this.solicitanteId = solicitanteId;
    }

    public Long getReceptorId() {
        return receptorId;
    }

    public void setReceptorId(Long receptorId) {
        this.receptorId = receptorId;
    }

}