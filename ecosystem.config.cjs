module.exports = {
    apps: [
        {
            name: 'axiom-backend',
            script: 'index.js',
            watch: false,
            interpreter: 'node',
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
