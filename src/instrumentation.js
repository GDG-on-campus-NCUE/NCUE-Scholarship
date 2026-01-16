export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const logPath = path.join(process.cwd(), 'restart.log');
      const now = new Date();
      const timeString = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      const message = `[${timeString}] Application started (PID: ${process.pid})
`;

      // Only log in production or when explicitly checking
      if (process.env.NODE_ENV === 'production') {
          fs.appendFileSync(logPath, message);
          console.log(`[Instrumentation] Logged restart to ${logPath}`);
      }
    } catch (err) {
      console.error('[Instrumentation] Failed to log restart:', err);
    }
  }
}