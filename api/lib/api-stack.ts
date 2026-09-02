import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable for deployment: ${name}`);
  }

  return value;
}

export class WorkshopApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const mppEnabled = process.env.MPP_ENABLED === "true";

    const contentFunction = new NodejsFunction(this, "ContentFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: mppEnabled
        ? process.env.MPP_HANDLER_ENTRY ?? "src/mpp-handler.solution.ts"
        : "src/handler.ts",
      handler: "handler",
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      logGroup: new logs.LogGroup(this, "ContentFunctionLogGroup", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: mppEnabled
        ? {
            CONTENT_VERSION: "x402-enabled",
            MPP_AMOUNT: process.env.MPP_AMOUNT ?? "0.01",
            MPP_REALM: process.env.MPP_REALM ?? "workshop-x402-api",
            MPP_SECRET_KEY: requiredEnv("MPP_SECRET_KEY"),
            STRIPE_LIVEMODE: process.env.STRIPE_LIVEMODE ?? "false",
            STRIPE_PROFILE_ID: requiredEnv("STRIPE_PROFILE_ID"),
            STRIPE_SECRET_KEY: requiredEnv("STRIPE_SECRET_KEY"),
            X402_FACILITATOR_URL: requiredEnv("X402_FACILITATOR_URL"),
          }
        : {
            CONTENT_VERSION: "starter",
          },
    });

    const api = new apigatewayv2.HttpApi(this, "WorkshopHttpApi", {
      apiName: "workshop-mpp-starter-api",
      description: "Starter API for the AWS Lambda mppx/x402 workshop",
    });

    api.addRoutes({
      path: "/content",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("ContentIntegration", contentFunction),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.apiEndpoint,
      description: "Base URL for the workshop API. Call GET /content.",
    });
  }
}
