package com.proyecto.spring.social_service.model.relations;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "solicitudes_amistad")
public class SolicitudAmistad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptor_id", nullable = false)
    private Usuario receptor;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @Column(name = "fecha_creacion")
    private Instant fechaCreacion = Instant.now();

    // Constructor vacío (JPA lo necesita para funcionar)
    public SolicitudAmistad() {
    }

    // Nuevo constructor para crear solicitudes fácilmente
    public SolicitudAmistad(Usuario solicitante, Usuario receptor) {
        this.solicitante = solicitante;
        this.receptor = receptor;
        this.estado = EstadoSolicitud.PENDIENTE;
        this.fechaCreacion = java.time.Instant.now();
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(Usuario solicitante) {
        this.solicitante = solicitante;
    }

    public Usuario getReceptor() {
        return receptor;
    }

    public void setReceptor(Usuario receptor) {
        this.receptor = receptor;
    }

    public EstadoSolicitud getEstado() {
        return estado;
    }

    public void setEstado(EstadoSolicitud estado) {
        this.estado = estado;
    }

    public Instant getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(Instant fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}