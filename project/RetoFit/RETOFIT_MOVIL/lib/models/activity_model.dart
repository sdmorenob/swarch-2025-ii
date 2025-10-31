class ActivityRequest {
  final int userId;
  final String tipo;
  final double distanciaKm;
  final double duracionMin;
  final DateTime fecha;

  ActivityRequest({
    required this.userId,
    required this.tipo,
    required this.distanciaKm,
    required this.duracionMin,
    required this.fecha,
  });

  Map<String, dynamic> toJson() => {
    "user_id": userId,
    "tipo": tipo,
    "distancia_km": distanciaKm,
    "duracion_min": duracionMin,
    "fecha": fecha.toIso8601String(),
  };
}

