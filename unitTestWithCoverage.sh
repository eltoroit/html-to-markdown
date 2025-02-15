rm -rf test_coverage
deno test --allow-all --env-file --coverage=test_coverage
deno coverage test_coverage --lcov --output=test_coverage/coverage.lcov > /dev/null 2>&1
genhtml --ignore-errors range -o test_coverage/.html_report test_coverage/coverage.lcov  > /dev/null 2>&1
code "./test_coverage/.html_report/index.html"