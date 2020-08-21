import { ActivationType } from "@/class";

export interface InvasionOption {
    name: string;
    detail: string;
}

export interface IAction {
    name: string;
    activation: ActivationType;
    init?: string;
    frequency?: string;
    trigger?: string;
    options?: InvasionOption[];
    detail: string;
}
