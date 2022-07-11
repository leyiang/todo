import {get} from "./utils";
import ModelHelper from "./ModelHelper";

class FolderHelpers extends ModelHelper {
    constructor() {
        super({
            item: "folder-item",
            input: "folder-add-new"
        });
    }

    create( name: string ) {
        const chain = this.getAddNewInput().click();

        if( ! name ) {
            chain.type("{enter}")
        } else {
            chain.type( name ).type("{enter}")
        }

        return chain;
    }
}

export const folderHelpers = new FolderHelpers();