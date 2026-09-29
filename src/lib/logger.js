function write(level, message, fields) {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...fields
  });

  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }

  process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields)
};
