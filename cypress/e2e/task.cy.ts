import {clickMenu, get, resetEnv} from "../shared/utils";
import {taskHelpers} from "../shared/helpers/TaskHelper";

describe('Task List', () => {
    beforeEach(() => {
        resetEnv();
    });

    it('able to add a new task', () => {
        const options = {
            name: "task name",
        }

        taskHelpers.create( options.name );

        taskHelpers
            .getAll()
            .should("have.length", 1)
            .should("contain.text", options.name );
    });

    it("empty name will not be added", () => {
        taskHelpers.create('');
        taskHelpers.create('    ');

        taskHelpers
            .getAll()
            .should("have.length", 0)
    });

    it("able to finish a task", () => {
        taskHelpers.create("123");

        taskHelpers
            .finishFirst();

        taskHelpers
            .getFirst()
            .should("have.class", "line-through")
            .should("have.class", "text-gray-500");
    });

    it('able to add a remove task', () => {
        taskHelpers.create("task");

        taskHelpers
            .getFirst()
            .rightclick();

        clickMenu("Remove Task");

        taskHelpers
            .getAll()
            .should("have.length", 0);
    });

    it("able to toggle detail", () => {
        taskHelpers.create("task");
        taskHelpers.getFirst().click();
        get("task-detail").should("exist");

        taskHelpers.getFirst().click();
        get("task-detail").should("not.exist");
    });

    it('remove task will de-focus it', () => {
        taskHelpers.create("task");

        taskHelpers
            .getFirst()
            .click()
            .rightclick();

        clickMenu("Remove Task");

        get("task-detail").should("not.exist");
    });

    it("finish task will not expand detail", () => {
        taskHelpers.create("task");
        taskHelpers.finishFirst();

        get("task-detail").should("not.exist");
    });
});
