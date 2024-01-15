const MaterialHelper = {};

MaterialHelper.availableMaterials = () => {
    return ["Gelatin"];
}

MaterialHelper.defaultParams = () => {
    let materialParamsDict = {
        Gelatin: {E: 0.1, X: 4, F: 0.0141}
    }
    return materialParamsDict
}

export default MaterialHelper;