REPORTER=spec

test:
	./node_modules/.bin/mocha -R $(REPORTER) --recursive

test-jenkins:
	$(MAKE) JUNIT_REPORT_PATH=test-report.xml JUNIT_REPORT_STACK=1 REPORTER=mocha-jenkins-reporter test

.PHONY: test
