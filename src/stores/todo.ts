import { defineStore } from "pinia";
import type List from "@/core/model/List";
import type Task from "@/core/model/Task";
import accessor from "@/core/accessor/AccessorInstance";
import { splice } from "@/core/shared/utils";
import type Step from "@/core/model/Step";

export const useTodoStore = defineStore("list", {
    state: () => {
        const data : {
            lists: List[],
            specialList: List[],
            list: List | null
            task: Task | null
        } = {
            lists: [],
            specialList: [],
            list: null,
            task: null,
        }

        return data;
    },

    actions: {
        getList() {
            accessor.getTaskLists().then( loaded => {
                this.lists = loaded;
                this.setList( loaded[0] );
            });
        },

        setList( list : List ) {
            this.list = list;
        },

        toggleTask( task: Task ) {
            if( this.task === task ) {
                this.task = null;
            } else {
                this.task = task;
            }
        },

        addList( list: List ) {
            this.lists.push( list );
        },

        removeTask( task: Task ) {
            const index = this.lists.findIndex( list => list.id === task.list_id );
            splice( this.lists[index].tasks, task );
        },

        removeTaskList( list: List ) {
            splice( this.lists, list );
        },

        removeStep( step: Step ) {
            if( this.task ) {
                splice( this.task.steps, step );
            }
        },

        /**
         * This method is used to update special lists
         * we need to get the update detail from backend
         * because we don't know which list will be updated
         * when some property on task is patched.
         * @param task
         * @param list_id_list
         */
        updateSpecialLists( task: Task, list_id_list: number[] ) {
            list_id_list.forEach( id => {
                const index = this.lists.findIndex(list => list.id === id );
                this.lists[index].tasks.push( task );
            });
        }
    }
});