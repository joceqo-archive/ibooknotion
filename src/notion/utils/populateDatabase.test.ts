import { Client } from "@notionhq/client";

export const _constructDatabaseEntryProps = (entries:Record<string, string|number|{title:boolean, value:string}>[]) => {
  return entries.reduce((acc, record) => {
    const key = Object.keys(record)[0];
    const value = record[key];
    const type = typeof value;

    if(typeof value === "object"){
      console.log("value", value)
      if(value.title){
        return {
          ...acc,
          [key]: {
            title: [
              {
                type: "text",
                text: {
                  content: value.value,
                },
              },
            ],
          },
        };
      }
    }

    if(key === "Title" && typeof value === "string"){
      return {
        ...acc,
        [value]: {
          title: [
            {
              type: "text",
              text: {
                content: value,
              },
            },
          ],
        },
      };
    }

    switch (type) {
      case "string":
        return {
          ...acc,
          [key]: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: value,
                },
              },
            ],
          },
        };
      case "number":
        return {
          ...acc,
          [key]: {
            number: value,
          },
        };
      default:
        console.log(type, key, value);
        const message = `Invalid type for ${key}: ${type}`;
        throw new Error(message);
    }
  }, {} as any);
}

export const populateDatabase = async ({
  notion,
  databaseId,
  entries,
}: {
  notion: Client;
  databaseId: string;
  entries: Record<string, any>[];
}) => {
  const props = _constructDatabaseEntryProps(entries);
  console.log("props", JSON.stringify(props, null, 2));

  // retrieve database 
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const databaseProperties = database.properties;
  const databasePropertiesKeys = Object.keys(databaseProperties);

  // validate entries throw invalid asap
  entries.forEach((entry) => {
    const entryKeys = Object.keys(entry);
    const invalidKeys = entryKeys.filter((key) => !databasePropertiesKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid properties found: ${invalidKeys.join(", ")}`);
    }
  });
  

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: props
  })
};