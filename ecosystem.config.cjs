module.exports = {
    apps: [
        {
            name: 'axiom-backend',
            script: 'index.js',
            watch: false,
            interpreter: 'node',
            env: {
                NODE_ENV: 'production',  // Always set, even on auto-restart
            },
        },
    ],
};
