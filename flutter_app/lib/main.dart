import 'package:flutter/material';
import 'package:provider/provider';
import 'theme/arcade_theme.dart';
import 'services/sound_service.dart';
import 'services/socket_service.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SoundService()),
        ChangeNotifierProxyProvider<SoundService, SocketService>(
          create: (_) => SocketService(),
          update: (_, sound, socket) => (socket ?? SocketService())..updateSoundService(sound),
        ),
      ],
      child: const TicTacToeArcadeApp(),
    ),
  );
}

class TicTacToeArcadeApp extends StatefulWidget {
  const TicTacToeArcadeApp({super.key});

  @override
  State<TicTacToeArcadeApp> createState() => _TicTacToeArcadeAppState();
}

class _TicTacToeArcadeAppState extends State<TicTacToeArcadeApp> {
  bool _isDarkMode = true;
  int _boardSize = 3;

  void _toggleTheme() {
    setState(() {
      _isDarkMode = !_isDarkMode;
    });
  }

  void _setBoardSize(int size) {
    setState(() {
      _boardSize = size;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tic Tac Toe Arcade',
      debugShowCheckedModeBanner: false,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ArcadeTheme.lightTheme,
      darkTheme: ArcadeTheme.darkTheme,
      home: HomeScreen(
        isDarkMode: _isDarkMode,
        onToggleTheme: _toggleTheme,
        boardSize: _boardSize,
        onSetBoardSize: _setBoardSize,
      ),
    );
  }
}
