import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/activity_model.dart';
import '../services/auth_service.dart';
import '../services/gamification_service.dart';

class ActivityScreen extends StatefulWidget {
  final int userId;
  const ActivityScreen({super.key, required this.userId});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final tipoController = TextEditingController();
  final distanciaController = TextEditingController();
  final duracionController = TextEditingController();
  final gamificationService = GamificationService();

  double _puntos = 0;
  bool _loadingPoints = true;
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _loadUserPoints();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
  }

  @override
  void dispose() {
    tipoController.dispose();
    distanciaController.dispose();
    duracionController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadUserPoints() async {
    setState(() => _loadingPoints = true);
    final puntos = await gamificationService.getUserPoints(widget.userId);
    setState(() {
      _puntos = puntos;
      _loadingPoints = false;
    });
  }

  Future<void> _registrarActividad() async {
    if (_formKey.currentState!.validate()) {
      final activity = ActivityRequest(
        userId: widget.userId,
        tipo: tipoController.text.trim(),
        distanciaKm: double.parse(distanciaController.text),
        duracionMin: double.parse(duracionController.text),
        fecha: DateTime.now(),
      );

      bool success = await gamificationService.processActivity(activity);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor:
          success ? Colors.green.shade600 : Colors.red.shade600,
          content: Text(
            success
                ? "Actividad registrada correctamente 🎉"
                : "Error al registrar actividad ❌",
            style: const TextStyle(color: Colors.white),
          ),
        ),
      );

      if (success) {
        tipoController.clear();
        distanciaController.clear();
        duracionController.clear();

        final nuevosPuntos =
        await gamificationService.getUserPoints(widget.userId);
        if (mounted) {
          _animatePointsChange(_puntos, nuevosPuntos);
        }
      }
    }
  }

  void _animatePointsChange(double oldValue, double newValue) {
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _animation = Tween<double>(begin: oldValue, end: newValue).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    )..addListener(() {
      setState(() {
        _puntos = _animation.value;
      });
    });

    _controller.forward(from: 0);
    _controller.forward().then((_) => _controller.dispose());
  }


  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final formatter = NumberFormat("#,##0", "es");

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: Container(
        height: size.height,
        width: size.width,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xfff54927), Color(0xfff87C63)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 80),
            child: Column(
              children: [
                const SizedBox(height: 10),
                const Text(
                  "Registra tu Actividad",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Suma más puntos por cada esfuerzo 💪",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 40),

                // Card principal
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                  shadowColor: Colors.black26,
                  color: Colors.white,
                  child: Padding(
                    padding:
                    const EdgeInsets.symmetric(horizontal: 25, vertical: 35),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // 🏆 PUNTOS
                        Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 18, horizontal: 25),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF8F0),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: _loadingPoints
                              ? const CircularProgressIndicator(
                              color: Color(0xFFFF6B35))
                              : Column(
                            children: [
                              Row(
                                mainAxisAlignment:
                                MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.emoji_events_rounded,
                                      color: Colors.amber, size: 22),
                                  SizedBox(width: 6),
                                  Text(
                                    "Tus puntos",
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.black87,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              AnimatedDefaultTextStyle(
                                duration:
                                const Duration(milliseconds: 500),
                                style: const TextStyle(
                                  fontSize: 38,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFFF6B35),
                                ),
                                child:
                                Text("${formatter.format(_puntos)} pts"),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 30),

                        // 📋 FORMULARIO
                        Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              _buildTextField(
                                controller: tipoController,
                                icon: Icons.directions_run_rounded,
                                iconColor: Colors.blue,
                                label: "Tipo de actividad",
                              ),
                              const SizedBox(height: 18),
                              _buildTextField(
                                controller: distanciaController,
                                icon: Icons.route_rounded,
                                iconColor: Colors.green,
                                label: "Distancia (km)",
                                keyboardType: TextInputType.number,
                              ),
                              const SizedBox(height: 18),
                              _buildTextField(
                                controller: duracionController,
                                icon: Icons.access_time_rounded,
                                iconColor: Colors.orange,
                                label: "Duración (min)",
                                keyboardType: TextInputType.number,
                              ),
                              const SizedBox(height: 30),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _registrarActividad,
                                  icon: const Icon(Icons.lock_rounded,
                                      color: Colors.white),
                                  label: const Text(
                                    "Registar Actividad",
                                    style: TextStyle(
                                        fontSize: 16, color: Colors.white),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xfff54927),
                                    padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    elevation: 4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required IconData icon,
    required Color iconColor,
    required String label,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: iconColor),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.black54),
        filled: true,
        fillColor: const Color(0xFFF9F9F9),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xfff54927), width: 1.5),
        ),
      ),
      validator: (value) => value!.isEmpty ? "Campo requerido" : null,
    );
  }
}
