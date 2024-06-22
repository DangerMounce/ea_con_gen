// This module holds functions relating to progress spinners

import logUpdate from "log-update";
import chalk from 'chalk'

const frames = [
    "( ●    )",
    "(  ●   )",
    "(   ●  )",
    "(    ● )",
    "(     ●)",
    "(    ● )",
    "(   ●  )",
    "(  ●   )",
    "( ●    )",
    "(●     )"
]

let index = 0;
let intervalId;

const updatingApp = () => {
    intervalId = setInterval(() => {
        const frame = frames[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Updating ea_con_gen ${frame}`)
        );
    }, 80);
}

const sendingContactAnimation = () => {
    intervalId = setInterval(() => {
        const frame = frames[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(frame)
        );
    }, 80);
}

const connectingToEndPoint = () => {
    intervalId = setInterval(() => {
        const frame = frames[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Connecting to endpoint ${frame}`)
        );
    }, 80);
};

const stopAnimation = () => {
    clearInterval(intervalId);
    logUpdate.clear(); // This clears the last update from the console if you are using log-update library
};

export const spinner = {
    connectingToEndPoint,
    stopAnimation,
    sendingContactAnimation,
    updatingApp
}