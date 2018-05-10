const _ = module.exports;

_.feed = {
  header: {},
  entity: [
    {
      id: '000001',
      is_deleted: false,
      trip_update: {
        trip: {
          trip_id: '065350_3..S01R',
          route_id: '3',
          direction_id: null,
          start_time: null,
          start_date: '20180510',
          schedule_relationship: null,
          nyct_trip_descriptor: {},
        },
        vehicle: null,
        stop_time_update: [{
          stop_sequence: null,
          stop_id: '101N',
          arrival: {},
          departure: null,
          schedule_relationship: null,
          nyct_stop_time_update: {
            scheduled_track: '4',
            actual_track: null,
          },
        }],
        timestamp: null,
        delay: null,
      },
      vehicle: null,
      alert: null,
    },
    {
      id: '000002',
      is_deleted: false,
      trip_update: null,
      vehicle: {},
      alert: null,
    },
    {
      id: '000003',
      is_deleted: false,
      trip_update: {
        trip: {
          trip_id: '064700_3..N01R',
          route_id: '3',
          direction_id: null,
          start_time: null,
          start_date: '20180510',
          schedule_relationship: null,
          nyct_trip_descriptor: {},
        },
        vehicle: null,
        stop_time_update: [{
          stop_sequence: null,
          stop_id: '135S',
          arrival: {},
          departure: null,
          schedule_relationship: null,
          nyct_stop_time_update: {},
        }, {
          stop_sequence: null,
          stop_id: '136S',
          arrival: {},
          departure: null,
          schedule_relationship: null,
          nyct_stop_time_update: {},
        }],
        timestamp: null,
        delay: null,
      },
      vehicle: null,
      alert: null,
    },
  ],
};
