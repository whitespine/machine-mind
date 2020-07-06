// Hacky way to preserve old web interfacing functionality. A better long term solution ought to be found, hopefully avoiding such prolific use of any
export var Capacitor: any;
export var store: any;
export var electron: any;
export var Vue: any;

export function init_data(_electron: any, _capacitor: any, _store: any, _vue: any) {
    electron = _electron;
    Capacitor = _capacitor;
    store = _store;
    Vue = _vue;
}
