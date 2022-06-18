import type {iAccessor} from "@/core/accessor/iAccessor";
import LocalStoreManager from "@/core/accessor/store/LocalStorageManager";
import Task from "@/core/model/Task";
import List from "@/core/model/List";
import Step from "@/core/model/Step";
import {format, last} from "@/core/shared/utils";
import ListFiller from "@/core/accessor/store/ListFiller";
import FilterOptions from "@/core/model/FilterOptions";
import IndexDBAdapter from "@/core/accessor/store/IndexDBAdapter";

class StoreAccessor implements iAccessor {
    #tasks: Task[];
    #lists: List[];
    #steps: Step[];
    #manager: LocalStoreManager;
    #adapter: IndexDBAdapter;
    filler: ListFiller;

    constructor() {
        this.filler = new ListFiller();
        this.#manager = new LocalStoreManager();
        this.#adapter = new IndexDBAdapter("TodoDatabase", 1);

        this.#tasks = [];
        this.#lists = [];
        this.#steps = [];

        /**
         * This Accessor can load data
         * from LocalStorage directly
         */
        this.#load();
    }

    #load(): void {
        this.#initDB();

        /**
         * Hook for db connected
         */
        this.#adapter.connected(() => {
            // this.#factory();
        });
    }

    #initDB() {
        this.#adapter.init((db: IDBDatabase) => {
            if (!db.objectStoreNames.contains("list")) {
                const store = db.createObjectStore("list", {autoIncrement: true, keyPath: 'id'})

                store.createIndex("name", "name", {unique: false});
                store.createIndex("icon", "icon", {unique: false});
                store.createIndex("filterOptions", "filterOptions", {unique: false});
                store.createIndex("settings", "settings", {unique: false});
            }

            if (!db.objectStoreNames.contains("task")) {
                const store = db.createObjectStore("task", {autoIncrement: true, keyPath: 'id'})

                store.createIndex("name", "name", {unique: false});
                store.createIndex("list_id", "list_id", {unique: false});
                store.createIndex("date", "date", {unique: false});
                store.createIndex("important", "important", {unique: false});
                store.createIndex("finish", "finish", {unique: false});
                store.createIndex("tags", "tags", {unique: false});
                store.createIndex("notes", "notes", {unique: false});
                store.createIndex("due_date", "due_date", {unique: false});
            }

            if (!db.objectStoreNames.contains("step")) {
                const store = db.createObjectStore("step", {autoIncrement: true, keyPath: 'id'})

                store.createIndex("name", "name", {unique: false});
                store.createIndex("task_id", "task_id", {unique: false});
                store.createIndex("finish", "finish", {unique: false});
            }
        });
    }

    #factory() {
        const data = {};

        this.#adapter.clear("list");
        this.#adapter.clear("task");
        this.#adapter.clear("step");

        // data.lists.forEach( list => {
        //     this.#adapter.addItem("list", list);
        // });
        //
        // data.tasks.forEach( task => {
        //     this.#adapter.addItem("task", task);
        // });
        //
        // data.steps.forEach( step => {
        //     this.#adapter.addItem("step", step);
        // });
    }

    #save(): void {
        const lists = JSON.parse(JSON.stringify(this.#lists));
        lists.forEach(list => list.tasks = []);

        const tasks = JSON.parse(JSON.stringify(this.#tasks));
        tasks.forEach(task => task.steps = []);

        this.#manager.set("lists", lists);
        this.#manager.set("tasks", tasks);
        this.#manager.set("steps", this.#steps);
    }

    fetchTasks(): Promise<Task[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(this.#tasks);
            }, 2000)
        });
    }

    parseTaskName(name: string): {} {
        let tags: string[] = [];

        /**
         * :book Book Name Here
         */
        if (name[0] === ":") {
            const firstSpaceIndex = name.indexOf(" ");
            const rawTag = name.slice(1, firstSpaceIndex);
            tags = rawTag.split(",");
            name = name.slice(firstSpaceIndex + 1);
        }

        return {
            name,
            tags
        }
    }

    addTask(name: string, list_id: number): Promise<Task> {
        const list: List | undefined = this.#lists.find(list => list.id === list_id );
        const info = this.parseTaskName(name);

        return new Promise((resolve) => {
            const task = new Task(0, info.name, list_id);
            task.tags = info.tags;

            delete task["id"];

            if( list !== undefined && list.filterOptions ) {
                list.filterOptions?.equal.forEach(item => {
                    const val = this.filler.parseValue( item.value );
                    task[ item.key ] = val;
                });
            }

            this.#adapter.connected(() => {
                this.#adapter.addItem("task", task).then(id => {
                    task.id = id;
                    this.#tasks.push(task);
                    resolve(task);
                });
            });
        });
    }

    updateTaskProp(task_id: number, key: string, val: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#adapter.connected(() => {
                const task = this.#tasks.find(task => task.id === task_id);

                if( task ) {
                    if (key === "name") {
                        task.name = val;
                    } else if( key === "notes" ) {
                        task.notes = val;
                    }

                    this.#adapter.update("task", task_id, task.toObject());
                    resolve();
                } else {
                    reject("Task Not Found");
                }
            });
        });
    }

    getTaskLists(): Promise<List[]> {
        return new Promise(resolve => {
            /**
             * Resolve Clone Version Array
             * To Prevent Local-Array-Reference Problems
             */
            this.#adapter.connected(() => {
                Promise.all([
                    this.#adapter.getAll("list"),
                    this.#adapter.getAll("task"),
                    this.#adapter.getAll("step"),
                ]).then(([
                     lists,
                     tasks,
                     steps
                ]) => {
                    lists = lists.map(List.Load);
                    tasks = tasks.map(Task.Load);
                    steps = steps.map(Step.Load);

                    this.filler.set(tasks, lists, steps);
                    this.filler.fill();

                    this.#tasks = tasks;
                    this.#lists = lists;
                    this.#steps = steps;

                    resolve(lists);
                });
            });
        });
    }

    addTaskList(
        name: string,
        icon: string | null = null,
        filterOptions: {} | null = null,
    ): Promise<List> {
        return new Promise(resolve => {

            const list = new List(0, name, icon, filterOptions);
            //@ts-ignore
            delete list["id"];

            this.#adapter.connected(() => {
                this.#adapter.addItem("list", list).then(id => {
                    this.#lists.push(list);
                    resolve(list);
                });
            });
        });
    }

    removeTask(task_id: number): Promise<number[]> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                this.#adapter.remove( "task", task_id );

                const list_id_list = this.#lists
                    .filter(list => list.tasks.map(task => task.id).includes(task_id))
                    .map(list => list.id);

                resolve(list_id_list);
            });
        });
    }

    removeTaskList(list_id: number): Promise<void> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                this.#adapter.remove("list", list_id);
                resolve();
            });
        });
    }

    updateTaskListProp(list_id: number, key: string, val: any): Promise<void> {
        return new Promise(resolve => {
            const index = this.#lists.findIndex(list => list.id === list_id);
            const list = this.#lists[index];

            // @ts-ignore
            list[key] = val;

            this.#save();
            resolve();
        });
    }

    addStep(name: string, task_id: number): Promise<Step> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                const step = new Step(0, name, task_id);
                //@ts-ignore
                delete step["id"];

                this.#adapter.addItem("step", step).then(id => {
                    step.id = id;
                    this.#steps.push(step);
                    resolve(step);
                });
            });
        });
    }

    setStepStatus(step_id: number, type: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#adapter.connected(() => {
                const step = this.#steps.find( step => step.id === step_id );

                if( step ) {
                    const value = step.toObject();
                    value.finish = type;

                    this.#adapter.update("step", step_id, value).then( r => {
                        resolve();
                    });
                } else {
                    reject("Step Not Found");
                }
            });
        });
    }

    removeStep(step_id: number): Promise<void> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                this.#adapter.remove("step", step_id).then( r => {
                    resolve();
                });
            });
        });
    }

    //
    factory() {
        const data: any = {};
        this.#manager.set("lists", data.lists);
        this.#manager.set("tasks", data.tasks);
        this.#manager.set("steps", data.steps);

        // accessor.addTaskList("My Day", "ic:outline-wb-sunny", true, {
        //     equal: [
        //         {
        //             key: "date",
        //             value: "__today__"
        //         }
        //     ]
        // });
        //
        // accessor.addTaskList("Important", "ic:round-star-border", true, {
        //     equal: [
        //         {
        //             key: "important",
        //             value: true
        //         }
        //     ]
        // });
        //
        // accessor.addTaskList("All", "ic:baseline-list-alt", true, {
        //     all: true
        // });

        // accessor.addTaskList("Books", "ic:round-menu-book", {
        //     tags: ["book"],
        // });
    }

    #setTaskImportantStatus(task: Task, val: any): void {
        if( typeof val === "boolean" ) {
            task.important = val;
        } else {
            throw new TypeError("Wrong Type");
        }
    }

    #setTaskFinishStatus(task: Task, val: any): void {
        if( typeof val === "boolean" ) {
            task.finish = val;
        } else {
            new TypeError("Wrong Type");
        }
    }

    #setTaskToday(task: Task, val: any): void {
        if( typeof val === "string" ) {
            task.date = val;
        } else {
            throw new TypeError("Wrong Type");
        }
    }

    setTaskSpecialProp(task_id:number, key: string, val: boolean | string | Date): Promise<number[]> {
        return new Promise((resolve, reject) => {
            const task = this.#tasks.find( task => task.id === task_id );

            if( task ) {
                const value = task.toObject();

                switch( key ) {
                    case "important" :
                        this.#setTaskImportantStatus( value, val );
                    break;

                    case "finish":
                        this.#setTaskFinishStatus( value, val );
                    break;

                    case "today":
                        this.#setTaskToday( value, val );
                    break;

                    default:
                        reject( new Error("Key is not allowed") );
                    break;
                }

                this.#adapter.connected(() => {
                    this.#adapter.update("task", task.id, value).then(() => {
                        const list_id_list = this.#lists
                            .filter(list => {
                                const equals = list.filterOptions
                                    ? list.filterOptions.equal.map(item => item.key)
                                    : [];

                                return equals.includes( key );
                            })
                            .map(list => list.id)

                        resolve(list_id_list);
                    });
                })
            } else {
                reject(
                    new Error("Task Not Found")
                );
            }
        });
    }

    updateStepProp(step_id: number, key: string, val: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#adapter.connected(() => {
                const step = this.#steps.find( step => step.id === step_id );

                if( step ) {
                    const value = step.toObject();

                    if( key === "name" ) {
                        value.name = val;
                    }

                    this.#adapter.update("step", step_id, value).then(r => {
                        resolve();
                    });

                } else {
                    reject("No step found");
                }
            })
        });
    }

    /**
     * We don't get tasks directly in the app
     * But we need to test the feature in the smallest range
     * So add this func for test purpose
     */
    getTasksForTest(): Promise<Task[]> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                this.#adapter.getAll("task").then( tasks => {
                    resolve( tasks );
                });
            });
        });
    }

    /**
     * We don't get tasks directly in the app
     * But we need to test the feature in the smallest range
     * So add this func for test purpose
     */
    getStepsForTest(): Promise<Step[]> {
        return new Promise(resolve => {
            this.#adapter.connected(() => {
                this.#adapter.getAll("step").then( steps => {
                    resolve( steps );
                });
            });
        });
    }
}

export default StoreAccessor;