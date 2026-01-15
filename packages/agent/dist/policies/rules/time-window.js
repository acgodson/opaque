export const timeWindowRule = {
    type: "time-window",
    name: "Time Window",
    description: "Only allow transactions during specific hours (UTC)",
    defaultConfig: {
        startHour: 9,
        endHour: 17,
    },
    async prepareConfig(context, config) {
        const { startHour = 9, endHour = 17, } = config;
        return {
            timeWindow: {
                enabled: true,
                startHour,
                endHour,
            },
        };
    },
};
