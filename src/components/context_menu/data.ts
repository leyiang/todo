export const data = new Map();

export function registerMenu( key: HTMLElement | string, options:{} ) {
    data.set( key, options );
}

export function getSpec( el: HTMLElement | null ) : any[] | null {
    if( el === null ) return null;

    // 1. data-menu-id
    // 2. el
    if( data.get(el) ) {
        return [ data.get(el), el ];
    } else if( data.get(el.dataset.menuId) ) {
        return [ data.get(el.dataset.menuId), el ];
    }

    return getSpec( el.parentElement );
}