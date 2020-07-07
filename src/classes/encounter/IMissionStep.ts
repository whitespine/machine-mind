import { MissionStepType } from "@/class";

 export interface IMissionStep {
    ID: string;
    Note: string;
    StepType: MissionStepType;
}
