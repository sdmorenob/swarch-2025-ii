import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:retofit_movil/screens/login_screen.dart';
import 'package:retofit_movil/screens/register_activity.dart';
import 'package:retofit_movil/providers/gamification_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const RetofitApp());
}

class RetofitApp extends StatelessWidget {
  const RetofitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => GamificationProvider()),
      ],
      child: MaterialApp(
        title: 'RETO-FIT',
        debugShowCheckedModeBanner: false,
        initialRoute: '/',
        onGenerateRoute: (settings) {
          if (settings.name == '/') {
            return MaterialPageRoute(builder: (_) => const LoginScreen());
          }
          if (settings.name == '/activities') {
            final userId = settings.arguments as int?;
            return MaterialPageRoute(
              builder: (_) => ActivityScreen(userId: userId ?? 0),
            );
          }
          return null;
        },
      ),
    );
  }
}
