import type Task from "@/core/model/Task";
import type Step from "@/core/model/Step";

export default class Folder {
    public plans: (Task | Step)[] = [];

    constructor(
        public id: number,
        public name: string,
        public order = 10,
    ) {
    }

    static isFolderParameters( obj: {} ) : obj is Folder {
        const requiredKeys = [ "id", "name" ];

        for(let key of requiredKeys) {
            if( ! obj.hasOwnProperty(key) ) {
                return false;
            }
        }

        return true;
    }

    static Load( raw: {} ) {
        if( raw === undefined || raw === null ) {
            throw "Load don't accept undefined or null as parameter";
        }

        if( Folder.isFolderParameters(raw) ) {
            return new Folder(
                raw.id,
                raw.name,
                raw.order,
            );
        } else {
            throw "Wrong Properties for Folder.Load";
        }
    }
}