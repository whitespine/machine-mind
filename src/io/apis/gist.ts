import axios from "axios";
import { IPilotData } from "@/interface";
import { Pilot } from "@/class";

// this token is scoped to only allow for the creation of gists on a burner account
// if this is insufficient, we'll move to a login scheme

// We do this as a simple measure to throw off gist sniffing for api tokens. Maybe they don't. I dunno
const token_part2 = "6f3344c6d179b4615974e3";
const token_part1 = "d36ae780843ff94460";
const gistToken = token_part1 + token_part2;

const gistApi = axios.create({
    baseURL: "https://api.github.com/gists",
    headers: {
        Authorization: "token " + gistToken,
    },
    responseType: "json",
});

const changelogGistID = "3eaedde89e606f60a6346ab190972edf";
const getChangelog = function() {
    return gistApi.get(changelogGistID).then(res => res.data);
};

const creditsGistID = "c79f09f5459c5991c1228c853191bd51";
const getCredits = function() {
    return gistApi.get(creditsGistID).then(res => res.data);
};

const newPilot = async function(pilot: Pilot): Promise<any> {
    return gistApi
        .post("", {
            files: {
                "pilot.txt": {
                    content: JSON.stringify(Pilot.Serialize(pilot)),
                },
            },
            description: `${pilot.Callsign} - ${pilot.Name} (LL:${pilot.Level})`,
            public: true,
        })
        .then(res => res.data);
};

const savePilot = async function(pilot: Pilot) {
    return gistApi
        .patch(pilot.CloudID, {
            files: {
                "pilot.txt": {
                    content: JSON.stringify(Pilot.Serialize(pilot)),
                },
            },
            description: `${pilot.Callsign} - ${pilot.Name} (LL:${pilot.Level})`,
        })
        .then(res => res.data);
};

const loadPilot = async function(id: string): Promise<IPilotData> {
    const gistData = (await gistApi.get(id)).data;
    const pilotData = JSON.parse(gistData.files["pilot.txt"].content) as IPilotData;
    // This is occasionally missing from the transmitted data
    pilotData.cloudID = id;
    return pilotData;
};

export { getChangelog, getCredits, newPilot, savePilot, loadPilot };
