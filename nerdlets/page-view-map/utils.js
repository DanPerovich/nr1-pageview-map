import { Base64 } from 'js-base64';
import uuidv4 from 'uuid';
import { EntitiesByIdsQuery } from 'nr1';

export const encodeEntityId = (accountId, domain, type, domainId) => {
    const urlSafeChars = {'+': '-', '/': '_', '=': ''};
    //id = md5(id)
    const id = `${accountId}|${domain}|${type}|${domainId}`
    const entityId = Base64.encode(id).replace(/[+=]/, (c => urlSafeChars[c]));
    return entityId;
}

/**
 * Returns an array of [accountId, domain, type, domainId]
 * @param {*} entityId
 */
export const decodeEntityId = (entityId) => {
    return Base64.decode(entityId).split("|");
}

export const loadEntity = (entityId) => {
    return new Promise(resolve => {
        EntitiesByIdsQuery.query({ entityIds: [entityId]}).then(results => {
            //console.debug(results);
            resolve(results.data.actor.entities[0]);
        }).catch(error => {
            console.error(error);
        });
    });
}

export const generateForecastData = (data) => {
    const forecast = {
        metadata: {
            name: 'Forecast',
            label: 'Forecast',
            id: uuidv4(),
            viz: 'main'
        },
        data: []
    };
    //loop through each point
    data.data.forEach(pt => {
        forecast.data.push({
            x: pt.x,
            y: randomForecast(pt.y)
        })
    });
    forecast.metadata.color = randomColor();

    return forecast;
}

const percentages = [0.9, 1.1, 1.03, 1.5, 2, 1.17, 0.85, 0.7, 1.7, 0.92]

const randomForecast = (x) => {
    const random = percentages[Math.floor(Math.random() * percentages.length)]
    return x * random
}