import 'package:flutter/material';
import 'package:provider/provider';
import '../services/sound_service.dart';
import '../services/socket_service.dart';
import '../theme/arcade_theme.dart';
import 'game_screen.dart';

class HomeScreen extends StatelessWidget {
  final bool isDarkMode;
  final VoidCallback onToggleTheme;
  final int boardSize;
  final ValueChanged<int> onSetBoardSize;

  const HomeScreen({
    super.key,
    required this.isDarkMode,
    required this.onToggleTheme,
    required this.boardSize,
    required this.onSetBoardSize,
  });

  void _openSettings(BuildContext context, SoundService soundService) {
    soundService.playEffect('click.wav');
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black54,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final isDark = Theme.of(context).brightness == Brightness.dark;
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF140E2D) : Colors.white,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
                border: Border.all(
                  color: ArcadeTheme.neonOrange.withOpacity(0.2),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'ARCADE SETTINGS',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.black,
                          letterSpacing: 1.0,
                          color: ArcadeTheme.neonOrange,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          soundService.playEffect('click.wav');
                          Navigator.pop(context);
                        },
                      )
                    ],
                  ),
                  const Divider(color: Colors.white12),
                  const SizedBox(height: 16),
                  
                  // Dark Mode theme switch row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Cabinet Theme (Dark Mode)',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Switch(
                        activeColor: ArcadeTheme.neonOrange,
                        value: isDarkMode,
                        onChanged: (val) {
                          onToggleTheme();
                          soundService.playEffect('click.wav');
                          setModalState(() {});
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Board Size setting row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Arena Grid Size',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Row(
                        children: [
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: boardSize == 3 
                                ? ArcadeTheme.neonOrange 
                                : Colors.black12,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              onSetBoardSize(3);
                              soundService.playEffect('click.wav');
                              setModalState(() {});
                            },
                            child: const Text('3x3'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: boardSize == 4 
                                ? ArcadeTheme.neonOrange 
                                : Colors.black12,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              onSetBoardSize(4);
                              soundService.playEffect('click.wav');
                              setModalState(() {});
                            },
                            child: const Text('4x4'),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Sound Toggle switch row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Synthesized Audio Effects',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Switch(
                        activeColor: ArcadeTheme.neonLime,
                        value: soundService.soundOn,
                        onChanged: (val) {
                          soundService.toggleSound();
                          setModalState(() {});
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final soundService = Provider.of<SoundService>(context);

    return Scaffold(
      body: Stack(
        children: [
          // Subtle drifting floating particle circles decoration background
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: CustomPaint(
                painter: FloatingParticlePainter(),
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                children: [
                  // Top Row (Branding and Settings trigger icon)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.flash_on, color: ArcadeTheme.neonPink, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            'AMUSEMENT STN',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              color: isDarkMode ? Colors.white60 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.settings, color: ArcadeTheme.neonOrange),
                        onPressed: () => _openSettings(context, soundService),
                      )
                    ],
                  ),
                  
                  const Spacer(),

                  // Giant Game Hero banner decoration
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: ArcadeTheme.neonOrange.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(
                        color: ArcadeTheme.neonOrange.withOpacity(0.12),
                      ),
                    ),
                    child: const Icon(
                      Icons.gamepad,
                      size: 64,
                      color: ArcadeTheme.neonOrange,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Hero Text Headings
                  Text(
                    'TIC TAC TOE',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: ArcadeTheme.neonOrange,
                      letterSpacing: -1.0,
                    ),
                  ),
                  Text(
                    'ARCADE',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 6.0,
                      color: isDarkMode ? Colors.white30 : Colors.black12,
                    ),
                  ),
                  
                  const Spacer(),

                  // Functional Trigger Actions group
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Play Online trigger button
                      Container(
                        decoration: BoxDecoration(
                          boxShadow: [
                            BoxShadow(
                              color: ArcadeTheme.neonOrange.withOpacity(0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            )
                          ],
                        ),
                        child: ElevatedButton.styleFrom(
                          backgroundColor: ArcadeTheme.neonOrange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ).build(
                          context,
                        ),
                        child: InkWell(
                          onTap: () {
                            soundService.playEffect('click.wav');
                            // Navigate to online game finder
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => GameScreen(
                                  isOnline: true,
                                  boardSize: boardSize,
                                  isDarkMode: isDarkMode,
                                ),
                              ),
                            );
                          },
                          child: const Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.people, size: 18),
                                SizedBox(width: 12),
                                Text(
                                  'PLAY ONLINE',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 2. Play Offline trigger button
                      Container(
                        decoration: BoxDecoration(
                          color: isDarkMode ? const Color(0xFF181235).withOpacity(0.6) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: ArcadeTheme.neonOrange.withOpacity(0.12),
                          ),
                        ),
                        child: InkWell(
                          onTap: () {
                            soundService.playEffect('click.wav');
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => GameScreen(
                                  isOnline: false,
                                  boardSize: boardSize,
                                  isDarkMode: isDarkMode,
                                ),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 18.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.play_arrow, color: ArcadeTheme.neonPink, size: 18),
                                SizedBox(width: 12),
                                Text(
                                  'PLAY OFFLINE',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const Spacer(),
                  
                  const Text(
                    'X_ARCADE_OS v1.0.0',
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 8,
                      color: Colors.white24,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Drifting micro circles backdrop painter
class FloatingParticlePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = ArcadeTheme.neonOrange;
    canvas.drawCircle(Offset(size.width * 0.2, size.height * 0.3), 30, paint);
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.6), 45, paint);
    canvas.drawCircle(Offset(size.width * 0.4, size.height * 0.8), 25, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
