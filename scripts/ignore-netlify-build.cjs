process.exitCode = [process.env.BRANCH, process.env.HEAD].includes('mejoras-v2') ? 0 : 1;
