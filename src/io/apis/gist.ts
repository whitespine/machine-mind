import axios from "axios";
import { PackedPilotData } from "@src/interface";
import { Pilot } from "@src/class";

// this token is scoped to only allow for the creation of gists on a burner account
// if this is insufficient, we'll move to a login scheme
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

// Don't need auth for fetching, so don't use them
const noAuthGistApi = axios.create({
    baseURL: "https://api.github.com/gists",
    responseType: "json",
});

export async function upload_new_pilot(pilot: Pilot): Promise<any> {
    return gistApi
        .post("", {
            files: {
                "pilot.txt": {
                    content: JSON.stringify(pilot.save()),
                },
            },
            description: `${pilot.Callsign} - ${pilot.Name} (LL:${pilot.Level})`,
            public: true,
        })
        .then(res => res.data);
}

export async function update_cloud_pilot(pilot: Pilot): Promise<any> {
    return gistApi
        .patch(pilot.CloudID, {
            files: {
                "pilot.txt": {
                    content: JSON.stringify(pilot.save()),
                },
            },
            description: `${pilot.Callsign} - ${pilot.Name} (LL:${pilot.Level})`,
        })
        .then(res => res.data);
}

export async function download_pilot(id: string): Promise<PackedPilotData> {
    const gistData = (await noAuthGistApi.get(id)).data;
    const pilotData = JSON.parse(gistData.files["pilot.txt"].content) as PackedPilotData;
    // This is occasionally missing from the transmitted data
    pilotData.cloudID = id;
    return pilotData;
}
