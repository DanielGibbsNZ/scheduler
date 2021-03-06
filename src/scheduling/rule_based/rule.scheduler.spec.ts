import {PeopleStore, Person} from "../people";
import {ScheduleInput} from "../common";
import {
    defaultAcousticGuitar,
    defaultSaxRole,
    defaultSoundRole,
    defaultSpeakerRole,
    defaultThemeRole,
    Role
} from "../tests/roles";
import {ScheduleWithRules} from "./scheduler";
import {Availability, AvailabilityEveryNOfM, AvailabilityUnit} from "../tests/scheduling-types";
import includes from 'lodash/includes';
import {CSVExporter} from "../exporter/csv.exporter";
import {addDaysToDate, constructSensibleDate} from "../common/date-utils";

describe('role scheduler', () => {
    let person_store: PeopleStore;

    let neil: Person;
    let params: ScheduleInput;
    let end_date: Date;
    let start_date: Date;
    let sound: Role;
    let schedule: ScheduleWithRules;

    beforeEach(() => {
        start_date = new Date();
        end_date = new Date();
        end_date.setDate(start_date.getDate() + 30);

        person_store = new PeopleStore();

        params = new ScheduleInput(person_store);
        params.start_date = start_date;
        params.end_date = end_date;
        params.people = person_store;

        sound = params.roles.find_role("Sound");
        expect(sound).not.toBeNull();

        neil = new Person("Neil");
        neil.add_role(sound);
        person_store.add_person(neil);
    });

    it('cannot create empty', () => {
        params.end_date = start_date;
        person_store.remove_person(neil);
        expect(() => {
            schedule = new ScheduleWithRules(params);
            schedule.create_schedule()
        }).toThrow();
    });

    it('can schedule neil weekly', () => {
        params.start_date = new Date(2017, 9, 1);
        params.end_date = new Date(2017, 9, 25);
        neil.add_role(defaultSoundRole);

        schedule = new ScheduleWithRules(params);
        expect(schedule).not.toBeNull();

        schedule.create_schedule();

        // expect to see neil on once per week, for N weeks.
        let dates = schedule.dates;
        expect(dates.length).toEqual(4);

        // expect to see dates 7 days apart
        let first_schedule = dates[0];
        // console.log("All: " + JSON.stringify(dates));
        // console.log("First: " + JSON.stringify(first_schedule));
        expect(first_schedule.date.getDate()).toEqual(1);

        // Check it has a person
        let people = first_schedule.people;
        expect(people.length).toEqual(1);
        expect(people[0].name).toEqual("Neil");

        expect(dates[1].date.getDate()).toEqual(8);
        expect(dates[2].date.getDate()).toEqual(15);
        expect(dates[3].date.getDate()).toEqual(22);
    });

    it('exclusions affect the layout', () => {
        params.start_date = new Date(2017, 9, 1);
        params.end_date = new Date(2017, 9, 25);
        neil.add_role(params.roles.find_role("Sound"));

        // Make myself available every 2 weeks, we should see a change to the schedule
        neil.prefs.availability = new Availability(2, AvailabilityUnit.EVERY_N_WEEKS);

        schedule = new ScheduleWithRules(params);
        expect(schedule).not.toBeNull();

        schedule.create_schedule();

        // Find the dates that have Neil doing something. Should be two.
        let all_scheduled = Array.from(schedule.dates.values());

        let dates_with_neil = all_scheduled.filter(sad => {
            console.log("Check " + JSON.stringify(sad.people));
            return includes(sad.people, neil);
        });
        expect(dates_with_neil.length).toEqual(2);
    });

    it('should be able to schedule 2 out of 3 weeks', function () {
        /*
        This builds a schedule where neil is on every 2 of 3 weeks.
         */
        neil.set_availability(new AvailabilityEveryNOfM(2, 3));

        schedule = new ScheduleWithRules(params);
        expect(schedule).not.toBeNull();
        schedule.create_schedule();

        console.log("Schedule: " + new CSVExporter(schedule));

    });

    it('should be test for 2 out of 3 weeks availability', function () {
        /*
        This builds a schedule where neil is on every week.
        We can then test the schedule.is_person_available method
         */
        schedule = new ScheduleWithRules(params);
        expect(schedule).not.toBeNull();
        schedule.create_schedule();
        let facts = schedule.facts;

        /*
        Only change neil AFTER the schedule is built. Since we don't want
        the availability to affect the building of the schedule in this test
         */
        neil.set_availability(new AvailabilityEveryNOfM(2, 3));

        console.log("Schedule: " + new CSVExporter(schedule));

        console.log("Test: " + start_date.toDateString());
        expect(facts.is_person_available(neil, start_date)).toBeTruthy();

        let next_date = addDaysToDate(start_date, 7);
        console.log("Test: " + next_date.toDateString());
        expect(facts.is_person_available(neil, next_date)).toBeTruthy();

        next_date = addDaysToDate(start_date, 14);
        console.log("Test: " + next_date.toDateString());
        expect(facts.is_person_available(neil, next_date)).toBeFalsy();

    });

    it('unavailable dates act like exclusion zones', () => {
        params.start_date = new Date(2017, 9, 1);
        params.end_date = new Date(2017, 9, 25);
        neil.remove_role(sound);
        neil.prefs.availability = new Availability(2, AvailabilityUnit.EVERY_N_WEEKS);
        neil.add_role(params.roles.find_role("Computer"));

        // If unavailability affects exclusions we should end up with not being able to schedule on the first date
        neil.add_unavailable(params.start_date);

        schedule = new ScheduleWithRules(params);
        expect(schedule).not.toBeNull();
        schedule.create_schedule();

        let all_scheduled = Array.from(schedule.dates.values());
        // console.log("ALL: " + JSON.stringify(all_scheduled));
        let dates_with_neil = all_scheduled.filter(sad => {
            console.log("Check: " + JSON.stringify(sad));
            return includes(sad.people, neil);
        });

        expect(dates_with_neil.length).toEqual(2);
        expect(dates_with_neil[0].date.getDate()).toEqual(8);
        expect(dates_with_neil[1].date.getDate()).toEqual(22);
    });

    it('limits placements based on max count', () => {
        // One week
        params.start_date = new Date(2017, 10, 1);
        params.end_date = new Date(2017, 10, 3);

        // Put neil on Guitar
        // And daniel on guitar as well
        neil.remove_role(sound);
        neil.prefs.availability = new Availability(1, AvailabilityUnit.AVAIL_ANYTIME);
        neil.add_role(defaultAcousticGuitar);

        let daniel = new Person("Daniel");
        person_store.add_person(daniel);
        daniel.add_role(defaultAcousticGuitar);

        defaultAcousticGuitar.maximum_count = 1;

        // Do a schedule. For one week.
        // We should see just ONE person on guitar.
        schedule = new ScheduleWithRules(params);
        schedule.create_schedule();

        let firstSchedule = Array.from(schedule.dates.values())[0];
        expect(firstSchedule).not.toBeNull();
        expect(firstSchedule.people_in_role(defaultAcousticGuitar).length).toBe(1);
        // console.log(schedule.jsonResult());
    });

    it('distributes among roles evenly', () => {
        // Make a 6 day schedule with 3 people, all available every day.
        // Expect to see a rotation, rather than the first person picked all the time
        params.start_date = new Date(2017, 10, 1);
        params.end_date = new Date(2017, 10, 6);
        params.days_per_period = 1;

        let daniel = new Person("Daniel");
        person_store.add_person(daniel);
        daniel.add_role(defaultSoundRole);

        let ben = new Person("Ben");
        person_store.add_person(ben);
        ben.add_role(defaultSoundRole);

        schedule = new ScheduleWithRules(params);
        schedule.create_schedule();
        let schedules = Array.from(schedule.dates.values());

        // console.log(schedule.jsonResult(true));

        schedule.dates.forEach(sc => {
            console.log("" + sc);
        });

        expect(schedules[0].people_in_role(defaultSoundRole)[0].name).toEqual("Neil");
        expect(schedules[1].people_in_role(defaultSoundRole)[0].name).toEqual("Daniel");
        expect(schedules[2].people_in_role(defaultSoundRole)[0].name).toEqual("Ben");
        expect(schedules[3].people_in_role(defaultSoundRole)[0].name).toEqual("Neil");
        expect(schedules[4].people_in_role(defaultSoundRole)[0].name).toEqual("Daniel");
    });

    describe('notes', () => {
        it('can record free text for a role position', function () {
            schedule = new ScheduleWithRules(params);
            let date = constructSensibleDate(2018, 1, 5);

            schedule.add_note(date, defaultSpeakerRole, "Hello");
            schedule.add_note(date, defaultThemeRole, "Coding");

            expect(schedule.notes_for_date(date, defaultSpeakerRole)).toEqual(["Hello"]);
            expect(schedule.notes_for_date(date, defaultThemeRole)).toEqual(["Coding"]);
            expect(schedule.notes_for_date(date, defaultSaxRole)).toEqual([]);
        });
    });
});