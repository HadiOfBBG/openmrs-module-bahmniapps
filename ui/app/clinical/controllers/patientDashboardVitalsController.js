angular.module('bahmni.clinical')
    .controller('PatientDashboardVitalsController', ['$scope', '$stateParams', 'patientVisitHistoryService', 'encounterService', '$q', function ($scope, $stateParams, patientVisitHistoryService, encounterService, $q) {
        $scope.test = "randomStuff";
        $scope.patientUuid = $stateParams.patientUuid;
        var createObservationsObject = function (encounterTransactions) {
            return new Bahmni.Clinical.EncounterTransactionToObsMapper().map(encounterTransactions);
        };
        var vitalsConceptName = 'Vitals';

        $scope.patientSummary = {};

        var getVisitHistory = function (visitData) {
            return new Bahmni.Clinical.VisitHistoryEntry(visitData)
        };

        var isVisitActive = function (visit) {
            return visit.isActive()
        };

        var init = function () {
            return patientVisitHistoryService.getVisits($scope.patientUuid).then(function (visits) {
                var deferred = $q.defer();
                $scope.visits = visits.map(getVisitHistory);
                $scope.activeVisit = $scope.visits.filter(isVisitActive)[0];
                deferred.resolve();
                return deferred.promise;
            });
        };

        var isObservationForVitals = function (obs) {
            return obs.concept && obs.concept.name === vitalsConceptName;
        };

        var observationGroupingFunction = function (obs) {
            return obs.observationDateTime.substring(0, 10);
        };

        var createPatientSummary = function () {
            if ($scope.activeVisit) {
                encounterService.search($scope.activeVisit.uuid).success(function (encounterTransactions) {
                    var visitData = createObservationsObject(encounterTransactions);

                    var vitalsObservations = visitData.filter(isObservationForVitals);

//                    var compoundObservation = new Bahmni.Clinical.CompoundObservation(visitData);
//                    var flattenedObservations = compoundObservation.tree;
//                    var observationsForConceptSet = flattenedObservations.filter(isObservationForVitals);


//                    $scope.patientSummary.data = new Bahmni.Clinical.ResultGrouper().group(observationsForConceptSet, observationGroupingFunction, 'obs', 'date');
                    $scope.patientSummary.data = new Bahmni.Clinical.ResultGrouper().group(vitalsObservations, observationGroupingFunction, 'obs', 'date');
                    if ($scope.patientSummary.data.length == 0) {
                        $scope.patientSummary.message = Bahmni.Clinical.Constants.messageForNoObservation;
                    }
                });
            }
            else {
                $scope.patientSummary.message = Bahmni.Clinical.Constants.messageForNoObservation;
            }
        };

        init().then(createPatientSummary);

    }]);