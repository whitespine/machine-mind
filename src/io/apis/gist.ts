import axios from "axios";
import { PackedPilotData } from "@src/interface";
import { Pilot } from "@src/class";

// this token is scoped to only allow for the creation of gists on a burner account
// if this is insufficient, we'll move to a login scheme
const gistToken = Buffer.from(
    "ZTk4MjJhZTE0MzYyMTRkNDY5YTlkZTNkMDIxMTRmODVkNTJhMjAwMg==",
    "base64"
).toString();

const gistApi = axios.create({
    baseURL: "https://api.github.com/gists",
    headers: {
        Authorization: "token " + gistToken,
    },
    responseType: "json",
});

/* potentially misleading at this point...
const changelogGistID = "3eaedde89e606f60a6346ab190972edf";
const getChangelog = function() {
    return gistApi.get(changelogGistID).then(res => res.data);
};

const creditsGistID = "c79f09f5459c5991c1228c853191bd51";
const getCredits = function() {
    return gistApi.get(creditsGistID).then(res => res.data);
};
*/

export async function upload_new_pilot(pilot: Pilot): Promise<any> {
    return gistApi
        .post("", {
            files: {
                "pilot.txt": {
                    content: JSON.stringify(await pilot.save()),
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
                    content: JSON.stringify(await pilot.save()),
                },
            },
            description: `${pilot.Callsign} - ${pilot.Name} (LL:${pilot.Level})`,
        })
        .then(res => res.data);
}

export async function download_pilot(id: string): Promise<PackedPilotData> {
    const gistData = (await gistApi.get(id)).data;
    const pilotData = JSON.parse(gistData.files["pilot.txt"].content) as PackedPilotData;
    // This is occasionally missing from the transmitted data
    pilotData.cloudID = id;
    return pilotData;
}
