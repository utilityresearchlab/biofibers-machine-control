const MaterialHelper = {};



MaterialHelper.defaultParams = () => {
    let materialParamsDict = {
        name: 'Gelatin - Default',
        E: 0.1, 
        X: 0,
        F: 0.2
    };
    return materialParamsDict;
}

MaterialHelper.availableMaterials = () => {
    return [
        MaterialHelper.defaultParams(),
        {
            name: 'Custom',
            E: 0.1, 
            X: 4,
            F: 0.5
        }

    ];
}


export default MaterialHelper;