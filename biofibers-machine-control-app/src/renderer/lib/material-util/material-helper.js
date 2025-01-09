const MaterialHelper = {};

MaterialHelper.availableMaterials = () => {
    return ["Gelatin"];
}

MaterialHelper.defaultParams = () => {
    let materialParamsDict = {
        Gelatin: {
            E: 0.1, 
            X: 0, 
            F: 0.2
        }
    };
    return materialParamsDict;
}

export default MaterialHelper;