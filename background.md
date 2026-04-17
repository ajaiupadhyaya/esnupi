Coding Agent Prompt

Build a portfolio website that simulates a full retro Macintosh System 7-style desktop environment as the homepage.

Core requirements:
The entire homepage must function as a desktop OS simulation
Full-screen fixed “desktop” background styled like classic Mac OS
Icons arranged on the desktop that represent navigation items (About, Projects, Contact, etc.)
Clicking icons opens draggable, resizable windows instead of navigating pages
Implement a windowing system
Windows should open, close, and overlap like a real OS
Each window has a title bar, close button, and content area
Windows must be draggable (use interact.js or equivalent)
Optional: bring-to-front z-index management when clicking windows
Create a custom cursor system
Replace default cursor with a retro pixelated Mac OS-style cursor
Cursor should smoothly follow mouse movement
Add hover states for clickable elements (icons/windows)
Styling direction:
Visual style: 1990s Macintosh System 7 aesthetic
Colors: beige/gray UI panels, black borders, subtle shadows
Fonts: Chicago / Geneva or closest web-safe equivalent
Pixel-perfect, slightly low-resolution UI feel
Optional enhancements (implement if possible):
Boot-up screen animation before desktop loads
Click sound effects for opening windows
CRT scanline or subtle screen noise overlay
Animated folder/icon opening transitions
Technical constraints:
Must run in modern browsers
No backend required
Prefer vanilla JS or lightweight framework (React optional)
Clean modular structure: /desktop, /windows, /icons, /cursor
Goal:

The site should feel like the user is inside a functioning old computer OS, not a website. Navigation should be entirely spatial and interactive through the desktop metaphor.