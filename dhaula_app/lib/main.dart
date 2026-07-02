import 'package:flutter/material.dart';

void main() {
  runApp(const DhaulaApp());
}

class DhaulaApp extends StatelessWidget {
  const DhaulaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dhaula',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E5945)),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const HelloScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class HelloScreen extends StatelessWidget {
  const HelloScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F2),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.rocket_launch,
              size: 64,
              color: Color(0xFF1E5945),
            ),
            const SizedBox(height: 24),
            Text(
              'Hello Dhaula!',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF143E30),
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'The Flutter rewrite has officially begun.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF4C5A53),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
