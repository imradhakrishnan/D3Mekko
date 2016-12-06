(function () {
    if (!mstrmojo.plugins.D3Mekko) {
        mstrmojo.plugins.D3Mekko = {};
    }

    mstrmojo.requiresCls(
        "mstrmojo.vi.models.CustomVisDropZones",
        "mstrmojo.array"
    );

    mstrmojo.plugins.D3Mekko.D3MekkoDropZones = mstrmojo.declare(
        mstrmojo.vi.models.CustomVisDropZones,
        null,
        {
            scriptClass: "mstrmojo.plugins.D3Mekko.D3MekkoDropZones",
            cssClass: "d3mekkodropzones",
            getCustomDropZones: function getCustomDropZones() {
                var ENUM_ALLOW_DROP_TYPE = mstrmojo.vi.models.CustomVisDropZones.ENUM_ALLOW_DROP_TYPE;

                return [
                    {
                        name: 'Animate By',
                        title: mstrmojo.desc(13828, 'Drag attribute here'),
                        maxCapacity: 1,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.ATTRIBUTE,
                        disabled: false
                    },
                    {
                        name: 'Series',
                        title: mstrmojo.desc(13827, 'Drag attribute here'),
                        maxCapacity: 1,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.ATTRIBUTE
                    },
                    {
                        name: 'Group By',
                        title: mstrmojo.desc(13827, 'Drag attributes here'),
                        minCapacity: 1,
                        maxCapacity: 5,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.ATTRIBUTE
                    },
                    {
                        name: 'Horizontal Axis Metric',
                        title: mstrmojo.desc(13827, 'Drag metric here'),
                        maxCapacity: 1,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.METRIC
                    },
                    {
                        name: 'Vertical Axis Metric',
                        title: mstrmojo.desc(13827, 'Drag metric here'),
                        maxCapacity: 1,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.METRIC
                    },
                    {
                        name: 'Color Axis Metric',
                        title: mstrmojo.desc(13827, 'Drag metric here'),
                        maxCapacity: 1,
                        allowObjectType: ENUM_ALLOW_DROP_TYPE.METRIC
                    },
                ];
            },
            shouldAllowObjectsInDropZone: function shouldAllowObjectsInDropZone(zone, dragObjects, idx, edge, context) {
                var me = this;
                return {
                    allowedItems: mstrmojo.array.filter(dragObjects, function (object) {
                        var isMetric = me.isMetric(object);
                        switch (zone.n) {
                            case 'Series':
                                return !(me.isObjectInZone(object, 'Group By') || me.isObjectInZone(object, 'Animate By')); // Can't have same unit from other drop zones
                            case 'Group By':
                                return !(me.isObjectInZone(object, 'Series') || me.isObjectInZone(object, 'Animate By'));
                            case 'Animate By':
                                return !(me.isObjectInZone(object, 'Series') || me.isObjectInZone(object, 'Group By'));
                        }
                        return true;
                    })
                };


            }
        })
}());
//@ sourceURL=D3MekkoDropZones.js