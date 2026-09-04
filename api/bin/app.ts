#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { WorkshopApiStack } from "../lib/api-stack";

const app = new cdk.App();

new WorkshopApiStack(app, "WorkshopApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "eu-west-1",
  },
});
