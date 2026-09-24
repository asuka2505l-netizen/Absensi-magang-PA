const isTimeBetween = (
    currentTime,
    startTime,
    endTime
) => {
    return (
        currentTime >= startTime &&
        currentTime <= endTime
    );
};

const getCurrentTime = () => {
    const now = new Date();

    return now
        .toTimeString()
        .slice(0, 8);
};

module.exports = {
    isTimeBetween,
    getCurrentTime
};