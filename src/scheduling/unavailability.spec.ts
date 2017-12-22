import {Unavailablity} from "../state/people";

describe('unavailability', () => {
    it('can model single date', () => {
        let unavil = new Unavailablity(new Date(2010, 10, 1));
        expect(unavil.matches_single_date(new Date(2010, 10, 1))).toBeTrue();
        expect(unavil.matches_single_date(new Date(2010, 11, 1))).toBeFalse();
        expect(unavil.matches_single_date(new Date(2009, 10, 1))).toBeFalse();
    });

    it('takes into account hours', () => {
        let unavil = new Unavailablity(new Date(2010, 10, 1, 10));
        expect(unavil.matches_single_date(new Date(2010, 10, 1, 10))).toBeTrue();
        expect(unavil.matches_single_date(new Date(2010, 10, 1, 10, 20))).toBeTrue();
        expect(unavil.matches_single_date(new Date(2010, 10, 1, 11, 20))).toBeFalse();
    });

    it('can check for date being "in" a day', () => {
        let unavil = new Unavailablity(new Date(2010, 10, 1));
        expect(unavil.contains_date(new Date(2010, 10, 1, 10))).toBeTrue();

        expect(unavil.contains_date(new Date(2010, 10, 1))).toBeTrue();
        expect(unavil.contains_date(new Date(2010, 10, 0))).toBeFalse();
        expect(unavil.contains_date(new Date(2010, 10, 2))).toBeFalse();
    });

    it('can model a date range', () => {
        let unavil = new Unavailablity(new Date(2010, 10, 1), new Date(2010, 11, 2));
        expect(unavil.contains_date(new Date(2010, 10, 1))).toBeTrue();
        expect(unavil.contains_date(new Date(2010, 10, 1, 10))).toBeTrue();
        expect(unavil.contains_date(new Date(2010, 11, 1))).toBeTrue();

        expect(unavil.contains_date(new Date(2010, 10, 0))).toBeFalse();
        expect(unavil.contains_date(new Date(2010, 11, 3))).toBeFalse();
    });

    it('truncates dates to the hour', () => {
        let morning = new Date(2017, 11, 1, 10, 30, 44);
        let byHour = Unavailablity.dayAndHourForDate(morning);
        expect(byHour).toEqual("2017/11/1@10");
    });

});