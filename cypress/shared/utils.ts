import {options} from "./globals";
import {taskHelpers} from "./helpers/TaskHelper";
import {stepHelpers} from "./helpers/StepHelper";

export function resetEnv() {
    indexedDB.deleteDatabase( options.db.name );
    cy.visit('/')
    taskHelpers.reset();
    stepHelpers.reset();
}

export function testID( name: string ) {
    return `[data-test='${ name }']`
}

export function get( name: string ) {
    //@ts-ignore, cy will be injected
    return cy.get( testID(name) );
}

export function clickMenu( label: string ) {
    get("context-menu")
        .contains(label )
        .click();
}
