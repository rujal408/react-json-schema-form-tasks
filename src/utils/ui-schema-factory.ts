(function () {
    if (window.UISchemaFactory) {
      delete window.UISchemaFactory;
    }
  
    class UISchemaFactory {
      constructor(masterDataUrl, options = {}) {
        this.axios = options.axios;
        this.mainRouteURL = options.mainRouteURL;
        this.toast = options.toast;
        this.form_status = options.form_status;
        this.optionsData = options.optionsData;
        this.setOptionsData = options.setOptionsData;
        this.formData = options.formData;
        this.setFormData = options.setFormData;
        this.setJsonSchema = options.setJsonSchema;
        this.setUiSchema = options.setUiSchema;
        this.adToBs = options.adToBs;
        this.bsToAd = options.bsToAd;
        this.masterDataUrl = masterDataUrl;
        this.isMasterDataLoaded = false;
        this.setNextStep = options.setNextStep;
        this.setRenderFormKey = options.setRenderFormKey;
        this.functionGroup = options.functionGroup;
        this.moment = options.moment;
        this.NepaliDate = options.NepaliDate;
        this.case_id = options.case_id;
        this.nationalityChanged;
        this.related_party = [{disabled:false},{disabled:false},{disabled:true}]
      }
  
      addLoader(arrayNames, loading) {
        this.setUiSchema((prevUiSchema) => ({
          ...prevUiSchema,
          [arrayNames[0]]: {
            ...prevUiSchema[arrayNames[0]],
            items: {
              ...prevUiSchema[arrayNames[0]].items,
              [arrayNames[1]]: {
                ...prevUiSchema[arrayNames[0]].items[arrayNames[1]],
                "ui:disabled": loading,
                "ui:options": {
                  ...prevUiSchema[arrayNames[0]].items[arrayNames[1]][
                    "ui:options"
                  ],
                  show_loader: loading,
                },
              },
            },
          },
        }));
      }
      addLoaderMultiple(arrayNames, loading) {
        this.setUiSchema((prevUiSchema) => ({
          ...prevUiSchema,
          [arrayNames[0]]: {
            ...prevUiSchema[arrayNames[0]],
            items: {
              ...prevUiSchema[arrayNames[0]].items,
              related_party_detail: {
                ...prevUiSchema[arrayNames[0]].items[arrayNames[1]],
                items: {
                  ...prevUiSchema[arrayNames[0]].items[arrayNames[1]].items,
                  [arrayNames[2]]: {
                    ...prevUiSchema[arrayNames[0]].items[arrayNames[1]].items[
                      arrayNames[2]
                    ],
                    "ui:disabled": loading,
                    "ui:options": {
                      ...prevUiSchema[arrayNames[0]].items[arrayNames[1]].items[
                        arrayNames[2]
                      ]["ui:options"],
                      show_loader: loading,
                    },
                  },
                },
              },
            },
          },
        }));
      }
  
      // FUNCTION TO FILTER OPTIONS AS PER CASCADE
      filterOptions(key, cascadeValue) {
        if (!this.optionsData[key]) return [];
  
        const filteredOptions = cascadeValue
          ? this.optionsData[key]?.filter((item) =>
              item.cascade_id?.includes(cascadeValue)
            ) || []
          : this.optionsData[key];
  
        return filteredOptions.map((item) => ({
          label: item.title,
          value: item.id,
        }));
      }
  
      filterOptionsCustomer(key, cascadeValue) {
        if (!this.optionsData[key]) return [];
  
        const TARGET_CASCADE = "9c0c15a4-c05c-4355-a880-4c9798543152";
  
        const filteredOptions = cascadeValue
          ? cascadeValue === TARGET_CASCADE
            ? this.optionsData[key].filter(
                (item) => item.cascade_id === TARGET_CASCADE
              )
            : this.optionsData[key].filter((item) => item.cascade_id === "")
          : this.optionsData[key];
  
        return filteredOptions.map((item) => ({
          label: item.title,
          value: item.id,
        }));
      }
  
      async formDataCleaner(fields, isMultiLayer, index) {
        if (typeof this.formData !== "object" || this.formData === null)
          return {};
  
        const result = {};
        const filterData = !isMultiLayer
          ? this.formData?.related_party?.[index ?? 0]
          : this.formData?.related_party?.[index?.[0]]?.related_party_detail?.[
              index?.[1]
            ];
  
        console.log(filterData, this.formData, isMultiLayer, index);
        // Keep only specified fields
        for (const key of fields) {
          if (key in filterData) {
            result[key] = filterData[key];
          }
        }
  
        // Handle family_information cleanup
        if (
          "family_information" in filterData &&
          Array.isArray(filterData.family_information) &&
          filterData.family_information.length > 0
        ) {
          const cleanedFamilyInfo = filterData.family_information.map(
            (item, index) => {
              if (index === 0) return item;
              const cleaned = { ...item };
              delete cleaned.family_member_full_name;
              delete cleaned.is_family_name_not_available;
              return cleaned;
            }
          );
          result.family_information = cleanedFamilyInfo;
        }
  
        // Handle id_type_details cleanup (only keep first item)
        if (
          "id_type_details" in filterData &&
          Array.isArray(filterData.id_type_details) &&
          filterData.id_type_details.length > 0
        ) {
          const cleanedIdTypes = filterData.id_type_details.map(
            (item, index) => index === 0 && item
          );
          result.id_type_details = cleanedIdTypes;
        }
  
        setTimeout(
          () =>
            isMultiLayer
              ? this.setFormData((prevData) => ({
                  ...prevData,
                  related_party: prevData?.related_party?.map((item, idx) =>
                    index[0] === idx
                      ? {
                          ...item,
                          related_party_detail: item?.related_party_detail?.map(
                            (data, idx2) => (index[1] === idx2 ? result : data)
                          ),
                        }
                      : item
                  ),
                }))
              : this.setFormData((prevData) => ({
                  ...prevData,
                  related_party: prevData?.related_party?.map((item, idx) =>
                    index === idx ? result : item
                  ),
                })),
          100
        );
  
        // this.setFormData(result)
        return result;
      }
      async getDedupCheck(index, isMultiLayer = false) {
        const nonClearableField = [
          "has_cif",
          "cif_number",
          "first_name",
          "middle_name",
          "last_name",
          "father_name",
          "dedup_id_number",
          "dedup_identification",
          "date_of_birth_ad",
          "date_of_birth_bs",
          "has_document",
          "account_info",
          "account_type_id",
          "account_scheme_id",
          "currency",
          "nationality",
          "customer_type_id",
          "constitution_code_id",
          "customer_status",
        ];
        !(
          this.formData?.related_party?.[index].has_cif ||
          this.formData?.related_party?.[index[0]]?.related_party_detail[index[1]]
            ?.has_cif
        ) && this.formDataCleaner(nonClearableField, isMultiLayer, index);
        isMultiLayer
          ? this.addLoaderMultiple(
              ["related_party", "related_party_detail", "dedup_check"],
              true
            )
          : this.addLoader(["related_party", "dedup_check"], true);
        try {
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/dedup-check`,
            {
              first_name: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.first_name
                : this.formData?.related_party?.[index].first_name,
              middle_name: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.middle_name
                : this.formData?.related_party?.[index].middle_name,
              last_name: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.last_name
                : this.formData?.related_party?.[index].last_name,
              father_name: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.father_name
                : this.formData?.related_party?.[index].father_name,
              id_number: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.dedup_id_number
                : this.formData?.related_party?.[index].dedup_id_number,
              document_type: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.dedup_identification
                : this.formData?.related_party?.[index].dedup_identification,
              citizenship_number: null,
              dob_ad: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.date_of_birth_ad
                : this.formData?.related_party?.[index].date_of_birth_ad,
              dob_bs: isMultiLayer
                ? this.formData?.related_party?.[index[0]]?.related_party_detail[
                    index[1]
                  ]?.date_of_birth_bs
                : this.formData?.related_party?.[index].date_of_birth_bs,
            }
          );
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data?.dedup_response;
          if (resp?.message?.includes("No Data")) {
            this.toast.info(resp.message);
          } else if (isMultiLayer) {
            this.setFormData((prevData) => ({
              ...prevData,
              related_party: prevData?.related_party?.map((item, idx) =>
                index[0] === idx
                  ? {
                      ...item,
                      related_party_detail: item?.related_party_detail?.map(
                        (data, idx2) =>
                          index[1] === idx2
                            ? {
                                ...data,
                                dedup_module_data: this.preprocessData(resp),
                              }
                            : data
                      ),
                    }
                  : item
              ),
            }));
          } else {
            this.setFormData((prevData) => ({
              ...prevData,
              related_party: prevData?.related_party?.map((item, idx) =>
                index === idx
                  ? { ...item, dedup_module_data: this.preprocessData(resp) }
                  : item
              ),
            }));
          }
  
          this.setRenderFormKey((prev) => prev + 1);
  
          return;
        } catch (error) {
          this.toast.error(error.response?.data?.message);
  
          return {};
        } finally {
          isMultiLayer
            ? this.addLoaderMultiple(
                ["related_party", "related_party_detail", "dedup_check"],
                false
              )
            : this.addLoader(["related_party", "dedup_check"], false);
        }
      }
  
      convertToArray(value, key, parentKey, comparisionKey, index, arrayName) {
        setTimeout(() => {
          this.setFormData((prevData) => {
            if (!prevData[arrayName]?.[index]?.[parentKey]) return prevData;
            if (!comparisionKey || comparisionKey.length === 0) {
              return {
                ...prevData,
                [arrayName]: prevData[arrayName].map((item, arrIndex) => {
                  return arrIndex === index
                    ? {
                        ...item,
                        [parentKey]: item[parentKey]?.map((data, index) =>
                          index === 0 ? { [key]: value } : data
                        ),
                      }
                    : item;
                }),
              };
            }
            const updatedArray = prevData[arrayName]?.[index]?.[parentKey].map(
              (item) => {
                if (Object.keys(item).length === 0) return { [key]: value };
  
                if (
                  comparisionKey &&
                  item[comparisionKey[1]] ===
                    prevData[arrayName]?.[index]?.[comparisionKey[0]]
                ) {
                  return { ...item, [key]: value };
                }
  
                return item;
              }
            );
  
            if (
              comparisionKey &&
              !updatedArray.some(
                (item) =>
                  item[comparisionKey[1]] ===
                  prevData[arrayName][index][comparisionKey[0]]
              )
            ) {
              updatedArray.push({
                [comparisionKey[1]]:
                  prevData[arrayName][index][comparisionKey[0]],
                [key]: value,
              });
            }
  
            return {
              ...prevData,
              [arrayName]: prevData[arrayName].map((item, arrIndex) =>
                index === arrIndex ? { ...item, [parentKey]: updatedArray } : item
              ),
            };
          });
        }, 100);
      }
  
      convertToArrayMultiple(
        value,
        key,
        parentKey,
        comparisionKey,
        indexPath,
        arrayPath
      ) {
        setTimeout(() => {
          this.setFormData((prevData) => {
            const clone = JSON.parse(JSON.stringify(prevData)); // deep copy to avoid mutation
  
            // Step 1: Traverse into nested arrays using arrayPath and indexPath
            let current = clone;
            for (let i = 0; i < arrayPath.length; i++) {
              const segment = arrayPath[i];
              const idx = indexPath[i] ?? 0;
              if (!Array.isArray(current[segment])) return prevData;
              current = current[segment][idx];
              if (!current) return prevData;
            }
  
            if (!current[parentKey]) return prevData;
  
            // Step 2: Modify the target array
            let updatedArray;
            if (!comparisionKey || comparisionKey.length === 0) {
              updatedArray = current[parentKey].map((item, i) =>
                i === 0 ? { [key]: value } : item
              );
            } else {
              updatedArray = current[parentKey].map((item) => {
                if (Object.keys(item).length === 0) return { [key]: value };
                if (item[comparisionKey[1]] === current[comparisionKey[0]]) {
                  return { ...item, [key]: value };
                }
                return item;
              });
  
              const exists = updatedArray.some(
                (item) => item[comparisionKey[1]] === current[comparisionKey[0]]
              );
  
              if (!exists) {
                updatedArray.push({
                  [comparisionKey[1]]: current[comparisionKey[0]],
                  [key]: value,
                });
              }
            }
  
            // Step 3: Update the target object
            current[parentKey] = updatedArray;
  
            return clone;
          });
        }, 100);
      }
  
      dropdownReset = async (dropdownClearObject, arrayName, index) => {
        setTimeout(() => {
          this.setFormData((prevFormData) => {
            const data = arrayName
              ? {
                  ...prevFormData,
                  [arrayName]: prevFormData[arrayName]?.map((item, arrIndex) => {
                    return arrIndex === index
                      ? { ...item, ...dropdownClearObject }
                      : item;
                  }),
                }
              : { ...prevFormData, ...dropdownClearObject };
            return data;
          });
        }, 100);
      };
  
      // dropdownReset = async (dropdownClearObject, arrayNames, indices) => {
      //   setTimeout(() => {
      //     this.setFormData((prevFormData) => {
      //       let data = { ...prevFormData };
  
      //       if (Array.isArray(arrayNames) && Array.isArray(indices)) {
      //         arrayNames.forEach((arrayName, idx) => {
      //           const targetIndex = indices[idx];
      //           if (Array.isArray(data[arrayName])) {
      //             data[arrayName] = data[arrayName].map((item, arrIndex) =>
      //               arrIndex === targetIndex
      //                 ? { ...item, ...dropdownClearObject }
      //                 : item
      //             );
      //           }
      //         });
      //       } else if (
      //         typeof arrayNames === "string" &&
      //         typeof indices === "number"
      //       ) {
      //         if (Array.isArray(data[arrayNames])) {
      //           data[arrayNames] = data[arrayNames].map((item, arrIndex) =>
      //             arrIndex === indices
      //               ? { ...item, ...dropdownClearObject }
      //               : item
      //           );
      //         }
      //       } else {
      //         data = { ...data, ...dropdownClearObject };
      //       }
      //       return data;
      //     });
      //   }, 100);
      // };
  
      dropdownResetMultipleLayer = async (
        dropdownClearObject,
        arrayNames,
        indices
      ) => {
        setTimeout(() => {
          this.setFormData((prevFormData) => {
            let data = { ...prevFormData };
  
            if (
              Array.isArray(arrayNames) &&
              Array.isArray(indices) &&
              arrayNames.length === indices.length
            ) {
              // Traverse down the path
              let current = data;
              for (let i = 0; i < arrayNames.length - 1; i++) {
                const arrayName = arrayNames[i];
                const index = indices[i];
                if (Array.isArray(current[arrayName])) {
                  current = current[arrayName][index];
                } else {
                  return prevFormData;
                }
              }
  
              const lastArrayName = arrayNames[arrayNames.length - 1];
              const lastIndex = indices[indices.length - 1];
  
              if (
                Array.isArray(current[lastArrayName]) &&
                current[lastArrayName][lastIndex]
              ) {
                current[lastArrayName][lastIndex] = {
                  ...current[lastArrayName][lastIndex],
                  ...dropdownClearObject,
                };
              } else {
                return prevFormData;
              }
            } else {
              return prevFormData;
            }
  
            return data;
          });
        }, 100);
      };
  
      // FUNCTION TO ADD PREFIX TO THE RESPONSE
      addPrefixToKeys(obj, prefix) {
        if (typeof obj !== "object" || obj === null) return obj;
  
        if (Array.isArray(obj)) {
          return obj.map((item) => this.addPrefixToKeys(item, prefix));
        }
  
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            prefix + key,
            this.addPrefixToKeys(value, prefix),
          ])
        );
      }
  
      // UPDATE THE RESPONSE AS PER THE TABLE WIDGET REQUIREMENT
      preprocessData(data) {
        if (!data) return "Empty";
  
        if (!Array.isArray(data)) {
          data = [data];
        }
  
        return data.reduce((acc, entry, index) => {
          if (typeof entry !== "object" || entry === null) return acc;
  
          const { source, ...rest } = entry;
          if (source && source.includes("institution")) return acc;
  
          const flatEntry = { key: index };
  
          for (const key in rest) {
            if (Array.isArray(rest[key]?.items)) {
              flatEntry[key] = rest[key].items.map((item) => ({ value: item }));
            } else {
              flatEntry[key] = rest[key] || "-";
            }
          }
  
          if (source) {
            if (!acc[source]) {
              acc[source] = [flatEntry];
            } else {
              acc[source].push(flatEntry);
            }
          } else {
            acc["Dedup Check"] = acc["Dedup Check"] || [];
            acc["Dedup Check"].push(flatEntry);
          }
  
          return acc;
        }, {});
      }
  
      updateSchemaReadonly = (schema, readonlyFields, readOnlyValue) => {
        if (!schema) return schema;
  
        const updatedSchema = { ...schema };
  
        // Handle properties
        if (updatedSchema.properties) {
          updatedSchema.properties = Object.fromEntries(
            Object.entries(updatedSchema.properties).map(([key, value]) => [
              key,
              readonlyFields.includes(key)
                ? { ...value, readOnly: readOnlyValue }
                : value,
            ])
          );
        }
  
        // Handle dependencies
        if (updatedSchema.dependencies) {
          updatedSchema.dependencies = Object.fromEntries(
            Object.entries(updatedSchema.dependencies).map(
              ([key, dependency]) => [
                key,
                {
                  ...dependency,
                  if: dependency.if
                    ? this.updateSchemaReadonly(
                        dependency.if,
                        readonlyFields,
                        readOnlyValue
                      )
                    : undefined,
                  then: dependency.then
                    ? this.updateSchemaReadonly(
                        dependency.then,
                        readonlyFields,
                        readOnlyValue
                      )
                    : undefined,
                  else: dependency.else
                    ? this.updateSchemaReadonly(
                        dependency.else,
                        readonlyFields,
                        readOnlyValue
                      )
                    : undefined,
                  oneOf: dependency?.oneOf?.map((subSchema) =>
                    this.updateSchemaReadonly(
                      subSchema,
                      readonlyFields,
                      readOnlyValue
                    )
                  ),
                  allOf: dependency?.allOf?.map((subSchema) =>
                    this.updateSchemaReadonly(
                      subSchema,
                      readonlyFields,
                      readOnlyValue
                    )
                  ),
                },
              ]
            )
          );
        }
        return updatedSchema;
      };
  
      convertDateSingle(
        selectedDate,
        setFormData,
        fromAdToBs,
        fieldKey,
        arrayName = null,
        index = null
      ) {
        const fieldMapping = {
          date_of_birth_ad: ["date_of_birth_ad", "date_of_birth_bs"],
          date_of_birth_bs: ["date_of_birth_ad", "date_of_birth_bs"],
          id_issued_date_ad: ["id_issued_date_ad", "id_issued_date_bs"],
          id_issued_date_bs: ["id_issued_date_ad", "id_issued_date_bs"],
          id_expiry_date_ad: ["id_expiry_date_ad", "id_expiry_date_bs"],
          id_expiry_date_bs: ["id_expiry_date_ad", "id_expiry_date_bs"],
        };
  
        const [adField, bsField] = fieldMapping[fieldKey] || [];
        if (!adField || !bsField) return;
  
        const convertedDate = fromAdToBs
          ? this.adToBs(selectedDate)
          : this.bsToAd(selectedDate);
  
        setFormData((prevFormData) => {
          const updatedFormData = { ...prevFormData };
  
          // Handle array fields (if arrayName and index are provided)
          if (arrayName && index !== null) {
            const array = updatedFormData[arrayName];
            if (Array.isArray(array) && array[index]) {
              updatedFormData[arrayName] = array.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      [adField]: fromAdToBs ? selectedDate : convertedDate,
                      [bsField]: fromAdToBs ? convertedDate : selectedDate,
                    }
                  : item
              );
            }
          }
          // Handle normal fields (if arrayName and index are not provided)
          else {
            updatedFormData[adField] = fromAdToBs ? selectedDate : convertedDate;
            updatedFormData[bsField] = fromAdToBs ? convertedDate : selectedDate;
          }
  
          return updatedFormData;
        });
  
        this.setRenderFormKey((prevData) => {
          return prevData + 1;
        });
      }
  
      convertDateSinglee(
        selectedDate,
        setFormData,
        fromAdToBs,
        fieldKey,
        arrayPath = "",
        index = []
      ) {
        const fieldMapping = {
          date_of_birth_ad: ["date_of_birth_ad", "date_of_birth_bs"],
          date_of_birth_bs: ["date_of_birth_ad", "date_of_birth_bs"],
          id_issued_date_ad: ["id_issued_date_ad", "id_issued_date_bs"],
          id_issued_date_bs: ["id_issued_date_ad", "id_issued_date_bs"],
          id_expiry_date_ad: ["id_expiry_date_ad", "id_expiry_date_bs"],
          id_expiry_date_bs: ["id_expiry_date_ad", "id_expiry_date_bs"],
        };
  
        const [adField, bsField] = fieldMapping[fieldKey] || [];
        if (!adField || !bsField) return;
  
        const convertedDate = fromAdToBs
          ? this.adToBs(selectedDate)
          : this.bsToAd(selectedDate);
  
        setFormData((prevFormData) => {
          if (!prevFormData) return prevFormData;
  
          // 🔹 Clone formData deeply to avoid mutation issues
          const updatedFormData = structuredClone(prevFormData);
  
          // 🔹 Traverse to the correct level dynamically
          let currentLevel = updatedFormData;
          const pathParts = arrayPath.split(".");
  
          pathParts.forEach((part, level) => {
            if (!currentLevel[part]) return;
            const idx = index[level];
  
            if (Array.isArray(currentLevel[part]) && idx !== undefined) {
              currentLevel = currentLevel[part][idx]; // Move deeper
            }
          });
  
          if (currentLevel) {
            // 🔹 Update the target fields
            currentLevel[adField] = fromAdToBs ? selectedDate : convertedDate;
            currentLevel[bsField] = convertedDate;
          }
  
          return { ...updatedFormData }; // Ensure React re-renders
        });
  
        // 🔹 Trigger re-render if required
        this.setRenderFormKey((prevData) => prevData + 1);
      }
  
      convertDate(
        selectedDate,
        setFormData,
        fromAdToBs,
        index,
        baseField,
        arrayPath
      ) {
        const adField = `${baseField}_ad`;
        const bsField = `${baseField}_bs`;
  
        const pathParts =
          typeof arrayPath === "string" && arrayPath.length > 0
            ? arrayPath.split(".")
            : [];
  
        setFormData((prev) => {
          // 🔹 Clone the entire formData without losing reactivity
          const newData = structuredClone(prev); // Modern alternative to deep cloning
  
          let currentLevel = newData;
          pathParts.forEach((part, level) => {
            const idx = index[level];
  
            if (!currentLevel[part]) return;
  
            if (Array.isArray(currentLevel[part])) {
              currentLevel[part] = currentLevel[part].map((item, i) => {
                if (i === idx) {
                  if (level === pathParts.length - 1) {
                    // 🔹 Prevent resetting when selectedDate is empty
                    if (selectedDate === "") return item;
  
                    const convertedDate = fromAdToBs
                      ? this.adToBs(selectedDate)
                      : this.bsToAd(selectedDate);
  
                    return {
                      ...item,
                      [adField]: fromAdToBs ? selectedDate : convertedDate,
                      [bsField]: fromAdToBs ? convertedDate : selectedDate,
                    };
                  }
                  return { ...item }; // 🔹 Ensures React detects the change
                }
                return item;
              });
            }
  
            currentLevel = currentLevel[part]?.[idx] || {};
          });
  
          return newData;
        });
        this.setRenderFormKey((prevData) => {
          return prevData + 1;
        });
      }
  
      filterOptionsByCascadeId(options, cascadeId) {
        const filteredOptions = options.filter(
          (option) => option.cascade_id == cascadeId
        );
  
        return filteredOptions;
      }
  
      async updateSchemaWithEnums(
        fieldKey,
        optionsData,
        setJsonSchema,
        cascadeId = null
      ) {
        const fieldMapping = {
          salutation: "salutations",
          gender: "genders",
  
          nationality: "nationalities",
          permanent_country: "countries",
          permanent_province: "provinces",
          permanent_district: "districts",
          permanent_municipality: "local_bodies",
          current_country: "countries",
          current_province: "provinces",
          current_district: "districts",
          current_municipality: "local_bodies",
          family_member_relation: "relationships",
          id_type_id: "document_types",
          issue_country: "countries",
          issued_district_text: "countries",
          issued_district: "districts",
          issuing_authority: "issuing_authorities",
          pep_relationsip: "relationships",
          mobile_country_code: "country_codes",
          phone_country_code: "country_codes",
          relation_with_account_holder: "relationships",
          family_account_holder: "relationship_status",
          occupation_type: "occupations",
          source_of_income: "income_sources",
          business_type: "business_type",
          marital_status: "marital_status",
          constitution_code_id: "constitution_types",
          customer_type_id: "customer_types",
        };
        const dataKey = fieldMapping[fieldKey] || fieldKey;
        let fieldOptions = optionsData[dataKey] || [];
  
        if (cascadeId !== null) {
          fieldOptions = this.filterOptionsByCascadeId(fieldOptions, cascadeId);
        }
  
        const enumValues = Array.from(
          new Set(fieldOptions.map((item) => String(item.id)))
        );
  
        const enumNames = fieldOptions.map((option) => option.title);
  
        this.setFormData((prevData) => ({ ...prevData }));
        setJsonSchema((prevSchema) => {
          if (!prevSchema || !prevSchema.properties) {
            return prevSchema;
          }
  
          const updateProperties = (schema) => {
            if (!schema || !schema.properties) return;
  
            for (const key in schema.properties) {
              const field = schema.properties[key];
  
              if (
                key === fieldKey &&
                (field.type === "string" || field.type === "array")
              ) {
                field.enum = [...enumValues];
                //field.enumNames = [...enumNames];
                field.selectOptions = enumValues.map((value, index) => ({
                  value,
                  label: enumNames[index],
                }));
              }
  
              if (field.type === "object" && field.properties) {
                updateProperties(field);
              }
  
              if (field.type === "array" && field.items?.properties) {
                updateProperties(field.items);
              }
            }
  
            // Handling dependencies or conditional schemas
            if (schema.dependencies) {
              for (const depKey in schema.dependencies) {
                const dependency = schema.dependencies[depKey];
                if (dependency.properties) {
                  updateProperties(dependency);
                } else if (dependency.oneOf || dependency.anyOf) {
                  (dependency.oneOf || dependency.anyOf).forEach((depSchema) => {
                    if (depSchema.properties) updateProperties(depSchema);
                  });
                } else if (dependency.if) {
                  if (dependency.then) updateProperties(dependency.then);
                  if (dependency.else) {
                    if (dependency.if) {
                      if (dependency.then) updateProperties(dependency.then);
                      if (dependency.else) updateProperties(dependency.else);
                    } else {
                      updateProperties(dependency.else);
                    }
                  }
                }
              }
            }
          };
  
          const updatedSchema = { ...prevSchema };
  
          updateProperties(updatedSchema);
          return updatedSchema;
        });
      }
  
      async familyNameChange(fieldName, value, arrayPath, index) {
        setTimeout(() => {
          this.setFormData((prevFormData) => {
            const newData = { ...prevFormData };
            let currentLevel = newData;
            const pathParts = arrayPath.split(".");
  
            pathParts.forEach((part, level) => {
              const idx = index[level];
  
              if (!currentLevel[part]) return;
  
              if (Array.isArray(currentLevel[part])) {
                currentLevel[part] = currentLevel[part].map((item, i) => {
                  if (i === idx) {
                    if (level === pathParts.length - 1) {
                      return {
                        ...item,
                        [fieldName]: value ? "Family Not Available" : "",
                      };
                    }
                    return { ...item };
                  }
                  return item;
                });
              }
  
              currentLevel = currentLevel[part][idx];
            });
  
            return newData;
          });
        }, 100);
      }
  
      async calculateRisk(index) {
        try {
          this.setUiSchema((prevUiSchema) => ({
            ...prevUiSchema,
            related_party: {
              ...prevUiSchema.related_party,
              items: {
                ...prevUiSchema.related_party.items,
                calculate_risk: {
                  ...prevUiSchema.related_party.items.calculate_risk,
                  "ui:options": {
                    ...prevUiSchema.related_party.items.calculate_risk?.[
                      "ui:options"
                    ],
                    show_loader: true,
                  },
                },
              },
            },
          }));
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/risk-check`,
            {
              ...this.formData?.related_party?.[index],
              category: "individual",
              id: this.case_id,
            }
          );
  
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data;
  
          this.setFormData((prevData) => ({
            ...prevData,
            related_party: prevData?.related_party?.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    risk_level: resp?.risk_level,
                    risk_score: resp?.risk_score,
                  }
                : item
            ),
          }));
  
          this.setJsonSchema((prevJsonSchema) => ({
            ...prevJsonSchema,
            isDisabled: false,
          }));
  
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.setUiSchema((prevUiSchema) => ({
            ...prevUiSchema,
            related_party: {
              ...prevUiSchema.related_party,
              items: {
                ...prevUiSchema.related_party.items,
                calculate_risk: {
                  ...prevUiSchema.related_party.items.calculate_risk,
                  "ui:options": {
                    ...prevUiSchema.related_party.items.calculate_risk?.[
                      "ui:options"
                    ],
                    show_loader: false,
                  },
                },
              },
            },
          }));
        }
      }
  
      async calculateRiskOneLevel(index) {
        try {
          this.setUiSchema((prevUiSchema) => ({
            ...prevUiSchema,
            related_party: {
              ...prevUiSchema.related_party,
              items: {
                ...prevUiSchema.related_party.items,
                related_party_detail: {
                  ...prevUiSchema.related_party.items.related_party_detail,
                  items: {
                    ...prevUiSchema.related_party.items.related_party_detail
                      .items,
                    calculate_risk: {
                      ...prevUiSchema.related_party.items.related_party_detail
                        .items.calculate_risk,
                      "ui:options": {
                        ...prevUiSchema.related_party.items.related_party_detail
                          .items.calculate_risk?.["ui:options"],
                        show_loader: true,
                      },
                    },
                  },
                },
              },
            },
          }));
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/risk-check`,
            {
              ...this.formData?.related_party?.[index?.[0]]
                ?.related_party_detail?.[index?.[1]],
              category: "individual",
              id: this.case_id,
            }
          );
  
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data;
          this.setFormData((prevData) => ({
            ...prevData,
            related_party: prevData?.related_party?.map((item, i) =>
              i === index[0]
                ? {
                    ...item,
                    related_party_detail: item?.related_party_detail?.map(
                      (item, i) =>
                        i === index[1]
                          ? {
                              ...item,
                              risk_level: resp?.risk_level,
                              risk_score: resp?.risk_score,
                            }
                          : item
                    ),
                  }
                : item
            ),
          }));
  
          this.setJsonSchema((prevJsonSchema) => ({
            ...prevJsonSchema,
            isDisabled: false,
          }));
  
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.setUiSchema((prevUiSchema) => ({
            ...prevUiSchema,
            related_party: {
              ...prevUiSchema.related_party,
              items: {
                ...prevUiSchema.related_party.items,
                related_party_detail: {
                  ...prevUiSchema.related_party.items.related_party_detail,
                  items: {
                    ...prevUiSchema.related_party.items.related_party_detail
                      .items,
                    calculate_risk: {
                      ...prevUiSchema.related_party.items.related_party_detail
                        .items.calculate_risk,
                      "ui:options": {
                        ...prevUiSchema.related_party.items.related_party_detail
                          .items.calculate_risk?.["ui:options"],
                        show_loader: false,
                      },
                    },
                  },
                },
              },
            },
          }));
        }
      }
  
      async initializeSchema(setJsonSchema, formData) {
        this.setJsonSchema((prevJsonSchema) => {
          console.log("prevJsonSchema", prevJsonSchema);
          return prevJsonSchema;
        });
        // this.setNextStep("ncna-corporate-cdd");
  
        // if (formData.nationality === "9c0c15a4-c05c-4355-a880-4c9798543152") {
        //   this.setJsonSchema((prevJsonSchema) => ({
        //     ...prevJsonSchema,
        //     related_party: {
        //       ...prevJsonSchema.related_party,
        //       items: {
        //         ...prevJsonSchema.related_party.items,
        //         properties: {
        //           ...prevJsonSchema.related_party.items.properties,
        //           id_type_details: {
        //             ...prevJsonSchema.related_party.items.properties
        //               .id_type_details,
        //             items: {
        //               ...prevJsonSchema.related_party.items.properties
        //                 .id_type_details.items,
        //               properties: {
        //                 ...prevJsonSchema.related_party.items.properties
        //                   .id_type_details.items.properties,
        //                 citizenship_number: {
        //                   type: "string",
        //                   title: "Citizenship Number",
        //                   hideTitle: true,
        //                   group: "Identification Detail",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     },
        //   }));
        // }
  
        const fieldsToUpdate = [
          "nationality",
          "permanent_country",
          "permanent_province",
          "permanent_district",
          "permanent_municipality",
          "current_country",
          "current_province",
          "current_district",
          "current_municipality",
          "family_member_relation",
          "id_type_id",
          "issue_country",
          "issued_district",
          "issuing_authority",
          "mobile_country_code",
          "phone_country_code",
          "pep_relationsip",
          "relation_with_account_holder",
          "family_account_holder",
          "occupation_type",
          "business_type",
          "salutation",
          "gender",
  
          "source_of_income",
          "marital_status",
          "issued_district_text",
          "constitution_code_id",
          "customer_type_id",
        ];
  
        for (const fieldKey of fieldsToUpdate) {
          this.updateSchemaWithEnums(fieldKey, this.optionsData, setJsonSchema);
        }
  
        // Update fields based on conditions
        this.updateFieldsBasedOnConditions(formData, setJsonSchema);
      }
  
      updateFieldsBasedOnConditions(formData, setJsonSchema) {
        setJsonSchema((prevSchema) => {
          if (!prevSchema || !prevSchema.properties) {
            return prevSchema;
          }
  
          // Get the original schema's required fields
          const originalRequired = new Set(
            prevSchema.originalRequired || prevSchema.required || []
          );
  
          const updatedProperties = Object.keys(prevSchema.properties).reduce(
            (acc, fieldKey) => {
              const field = prevSchema.properties[fieldKey];
              acc[fieldKey] = field;
              return acc;
            },
            {}
          );
          return {
            ...prevSchema,
            originalRequired: Array.from(originalRequired), // Preserve original required fields
            properties: updatedProperties,
          };
        });
      }
  
      async fetchRelatedPartyEnquiry(index, cif_id) {
        this.addLoader(["related_party", "cif_enquiry"], true);
        try {
          if (!(cif_id || this.formData?.related_party?.[index]?.cif_number)) {
            this.toast.error("Please enter a CIF Number");
            return;
          }
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/cif-enquiry`,
            {
              cif_number:
                this.formData?.related_party?.[index]?.cif_number ?? cif_id,
            }
          );
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data;
          if (resp)
            this.setFormData((prevFormData) => {
        // const updatedDetails = [...prevFormData?.related_party];
        // updatedDetails[index ?? 0] = {
        //     ...updatedDetails[index ?? 0],
        //     ...resp,
        // };
        this.related_party[index] = {disabled:true}
                const related_party = [...prevFormData?.related_party].map((x,i)=>i===index?{...x,...resp}:x)
        console.log({index,related_party})
  
              return {
                ...prevFormData,
                related_party,
              };
            });
  
          this.setUiSchema((prevSchema) => {
            const updatedUiSchema = { ...prevSchema.related_party.items };
            for (const key in resp) {
              // if (updatedUiSchema[key]) {
              const existing = updatedUiSchema[key];
  
              if (existing?.items) {
                updatedUiSchema[key] = {
                  ...existing,
                  "ui:options": {
                    ...(existing["ui:options"] || {}),
                    addable: false,
                    removable: false,
                    orderable: false,
                    related_party:this.related_party,
                  },
                  "ui:disabled": true,
                  items: {
                    ...(existing?.items || {}),
                    "ui:disabled": true,
                  },
                };
              } else {
                updatedUiSchema[key] = {
                  ...existing,
                  "ui:disabled": true,
                };
              }
              // }
            }
  
            return {
              ...prevSchema,
              related_party: {
                ...prevSchema?.related_party,
                items: updatedUiSchema,
              },
            };
          });
  
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.addLoader(["related_party", "cif_enquiry"], false);
        }
      }
      async fetchRelatedPartyEnquiryMultipleLayer(index, cif_id) {
        this.addLoaderMultiple(
          ["related_party", "related_party_detail", "cif_enquiry"],
          true
        );
        try {
          if (
            !(
              cif_id ||
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.cif_number
            )
          ) {
            this.toast.error("Please enter a CIF Number");
            return;
          }
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/cif-enquiry`,
            {
              cif_number:
                cif_id ??
                this.formData.related_party?.[index[0]]?.related_party_detail[
                  index[1]
                ]?.cif_number,
            }
          );
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data;
  
          this.setFormData((prevFormData) => {
            const updatedFormData = { ...prevFormData };
  
            if (!updatedFormData.related_party) return prevFormData;
  
            const relatedParty = updatedFormData.related_party?.[index[0]];
            if (!relatedParty) return prevFormData;
  
            if (!relatedParty.related_party_detail) return prevFormData;
  
            const updatedRelatedPartyDetail = [
              ...relatedParty.related_party_detail,
            ];
            if (!updatedRelatedPartyDetail[index[1]]) return prevFormData;
  
            updatedRelatedPartyDetail[index[1]] = {
              ...updatedRelatedPartyDetail[index[1]],
              ...resp,
            };
  
            updatedFormData.related_party[index[0]] = {
              ...relatedParty,
              related_party_detail: updatedRelatedPartyDetail,
            };
  
            return updatedFormData;
          });
          const path = [
            "related_party",
            index[0],
            "related_party_detail",
            index[1],
          ];
  
          // this.setUiSchema((prevUiSchema) => {
          //   debugger;
          //   const updatedUiSchema = {
          //     ...prevUiSchema?.related_party?.items?.related_party_detail?.items,
          //   };
  
          //   for (const key in resp) {
          //     // if (updatedUiSchema[key]) {
          //     const existing = updatedUiSchema[key];
  
          //     if (existing?.items) {
          //       updatedUiSchema[key] = {
          //         ...existing,
          //         "ui:options": {
          //           ...(existing["ui:options"] || {}),
          //           addable: false,
          //           removable: false,
          //           orderable: false,
          //         },
          //         "ui:disabled": true,
          //         items: {
          //           ...(existing?.items || {}),
          //           "ui:disabled": true,
          //         },
          //       };
          //     } else {
          //       updatedUiSchema[key] = {
          //         ...existing,
          //         "ui:disabled": true,
          //       };
          //     }
          //     // }
          //   }
  
          //   return {
          //     ...prevUiSchema,
          //     related_party: {
          //       ...prevUiSchema?.related_party,
          //       items: {
          //         ...prevUiSchema?.related_party?.items,
          //         related_party_detail: {
          //           ...prevUiSchema?.related_party?.items?.related_party_detail,
          //           items: updatedUiSchema,
          //         },
          //       },
          //     },
          //   };
          // });
  
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.addLoaderMultiple(
            ["related_party", "related_party_detail", "cif_enquiry"],
            false
          );
        }
      }
  
      async fetchRelatedPartyInfoScreening(index) {
        if (
          !(
            this.formData?.related_party?.first_name ||
            this.formData?.related_party?.[index]?.first_name
          )
        ) {
          this.toast.error("Please enter a First Name");
          return;
        }
        this.addLoader(["related_party", "personal_info_screening"], true);
        try {
          let payload = {
            first_name:
              this.formData?.related_party?.first_name ||
              this.formData?.related_party?.[index]?.first_name,
            middle_name:
              this.formData?.related_party?.middle_name ||
              this.formData?.related_party?.[index]?.middle_name,
            last_name:
              this.formData?.related_party?.last_name ||
              this.formData?.related_party?.[index]?.last_name,
            father_name: this.formData?.related_party?.[index]?.father_name,
            identification_number:
              this.formData?.related_party?.[index]?.identification_number,
          };
  
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/screening-check`,
            payload
          );
  
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data?.screening_lists;
  
          this.setFormData((prevData) => ({
            ...prevData,
            related_party: prevData?.related_party?.map((item, i) =>
              i === index
                ? {
                    ...item,
                    personal_screening_data: this.preprocessData(resp),
                  }
                : item
            ),
          }));
          this.setRenderFormKey((prev) => prev + 1);
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.addLoader(["related_party", "personal_info_screening"], false);
        }
      }
  
      async fetchRelatedPartyInfoScreeningMultipleLayer(index) {
        if (
          !(
            this.formData.related_party?.[index[0]]?.related_party_detail
              ?.first_name ||
            this.formData.related_party?.[index[0]]?.related_party_detail[
              index[1]
            ]?.first_name
          )
        ) {
          this.toast.error("Please enter a First Name");
          return;
        }
        this.addLoaderMultiple(
          ["related_party", "related_party_detail", "personal_info_screening"],
          true
        );
  
        try {
          let payload = {
            first_name:
              this.formData.related_party?.[index[0]]?.related_party_detail
                ?.first_name ||
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.first_name,
            middle_name:
              this.formData.related_party?.[index[0]]?.related_party_detail
                ?.middle_name ||
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.middle_name,
            last_name:
              this.formData.related_party?.[index[0]]?.related_party_detail
                ?.last_name ||
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.last_name,
            father_name:
              this.formData.related_party?.[index[0]]?.related_party_detail
                ?.father_name ||
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.father_name,
            identification_number:
              this.formData.related_party?.[index[0]]?.related_party_detail[
                index[1]
              ]?.identification_number,
          };
  
          const response = await this.axios.post(
            `${this.mainRouteURL}/external-api/screening-check`,
            payload
          );
  
          if (!response) {
            throw new Error("Network response was not ok");
          }
          const resp = response?.data?.data?.screening_lists;
  
          this.setFormData((prevData) => ({
            ...prevData,
            related_party: prevData?.related_party?.map((item, i) =>
              i === index[0]
                ? {
                    ...item,
                    related_party_detail: item?.related_party_detail?.map(
                      (item, i) =>
                        i === index[1]
                          ? {
                              ...item,
                              personal_screening_data: this.preprocessData(resp),
                            }
                          : item
                    ),
                  }
                : item
            ),
          }));
          this.setRenderFormKey((prev) => prev + 1);
          return;
        } catch (error) {
          console.error("Error fetching options:", error);
          return {};
        } finally {
          this.addLoaderMultiple(
            ["related_party", "related_party_detail", "personal_info_screening"],
            false
          );
        }
      }
  
      async updateFormAndSchema(formData, schemaConditions) {
        this.formData = formData;
      }
  
      createUISchema(options) {
        const {
          setJsonSchema,
          formData,
          setFormData,
          jsonSchema,
          ObjectFieldTemplate,
          ArrayFieldTemplate,
          widgets,
        } = options;
  
        const sameAsPermanentOnChange = (value, index) => {
          setTimeout(
            () =>
              this.setFormData((prevFormData) => {
                const updatedJointDetails = [...prevFormData.related_party];
  
                if (value) {
                  // Copy permanent address values to current address for the specific index
                  updatedJointDetails[index] = {
                    ...updatedJointDetails[index],
                    same_as_permanent: value,
                    current_country:
                      updatedJointDetails[index].permanent_country ||
                      "79f0a217-d50c-4bc6-a509-8a300f9a30c2",
                    current_province:
                      updatedJointDetails[index].permanent_province || "",
                    current_district:
                      updatedJointDetails[index].permanent_district || "",
                    current_municipality:
                      updatedJointDetails[index].permanent_municipality || "",
                    current_ward_number:
                      updatedJointDetails[index].permanent_ward_number || "",
                    current_street_name:
                      updatedJointDetails[index].permanent_street_name || "",
                    current_town: updatedJointDetails[index].permanent_town || "",
                    current_house_number:
                      updatedJointDetails[index].permanent_house_number || "",
                    current_outside_town:
                      updatedJointDetails[index].permanent_outside_town || "",
                    current_outside_street_name:
                      updatedJointDetails[index].permanent_outside_street_name ||
                      "",
                  };
                } else {
                  // Reset current address fields for the specific index
                  updatedJointDetails[index] = {
                    ...updatedJointDetails[index],
                    same_as_permanent: value,
                    current_country: "79f0a217-d50c-4bc6-a509-8a300f9a30c2", // Default
                    current_province: "",
                    current_district: "",
                    current_municipality: "",
                    current_ward_number: "",
                    current_street_name: "",
                    current_town: "",
                    current_house_number: "",
                    current_outside_town: "",
                    current_outside_street_name: "",
                  };
                }
  
                return { ...prevFormData, related_party: updatedJointDetails };
              }),
            100
          );
        };
        const sameAsPermanentOnChangeMultiple = (value, index) => {
          setTimeout(() => {
            this.setFormData((prevFormData) => {
              const updatedFormData = { ...prevFormData };
              const relatedParties = [...(prevFormData?.related_party || [])];
  
              const partyIdx = index[0];
              const detailIdx = index[1];
  
              const relatedParty = relatedParties[partyIdx];
              const partyDetails = [
                ...(relatedParty?.related_party_detail || []),
              ];
  
              const currentDetail = { ...partyDetails[detailIdx] };
  
              const defaultCountry = "79f0a217-d50c-4bc6-a509-8a300f9a30c2";
  
              if (value) {
                // Copy permanent address values to current
                partyDetails[detailIdx] = {
                  ...currentDetail,
                  same_as_permanent: true,
                  current_country:
                    currentDetail.permanent_country || defaultCountry,
                  current_province: currentDetail.permanent_province || null,
                  current_district: currentDetail.permanent_district || null,
                  current_municipality:
                    currentDetail.permanent_municipality || null,
                  current_ward_number: currentDetail.permanent_ward_number || "",
                  current_street_name: currentDetail.permanent_street_name || "",
                  current_town: currentDetail.permanent_town || "",
                  current_house_number:
                    currentDetail.permanent_house_number || "",
                  current_outside_town:
                    currentDetail.permanent_outside_town || "",
                  current_outside_street_name:
                    currentDetail.permanent_outside_street_name || "",
                };
              } else {
                // Clear current address fields
                partyDetails[detailIdx] = {
                  ...currentDetail,
                  same_as_permanent: false,
                  current_country: defaultCountry,
                  current_province: null,
                  current_district: null,
                  current_municipality: null,
                  current_ward_number: "",
                  current_street_name: "",
                  current_town: "",
                  current_house_number: "",
                  current_outside_town: "",
                  current_outside_street_name: "",
                };
              }
  
              relatedParties[partyIdx] = {
                ...relatedParty,
                related_party_detail: partyDetails,
              };
  
              updatedFormData.related_party = relatedParties;
              return updatedFormData;
            });
          }, 100);
        };
        const handleLastNameNotAvailableChange = (
          fieldName,
          value,
          arrayPath,
          index
        ) => {
          setTimeout(() => {
            this.setFormData((prevFormData) => {
              const updatedRelatedPartyDetails = [...prevFormData[arrayPath]];
              updatedRelatedPartyDetails[index] = {
                ...updatedRelatedPartyDetails[index],
                [fieldName]: value ? "N/A" : "",
              };
  
              return {
                ...prevFormData,
                [arrayPath]: updatedRelatedPartyDetails,
              };
            });
          }, 100);
        };
  
        const handleEmailNotAvailableChange = (
          fieldName,
          value,
          arrayPath,
          index
        ) => {
          setTimeout(() => {
            this.setFormData((prevFormData) => {
              const updatedRelatedPartyDetails = [...prevFormData[arrayPath]];
              updatedRelatedPartyDetails[index] = {
                ...updatedRelatedPartyDetails[index],
                [fieldName]: value ? "N/A" : "",
              };
  
              return {
                ...prevFormData,
                [arrayPath]: updatedRelatedPartyDetails,
              };
            });
          }, 100);
        };
  
        const ChangeFiledToDot = (fieldName, value, arrayPath, index) => {
          setTimeout(() => {
            this.setFormData((prevFormData) => {
              const newData = { ...prevFormData };
              let currentLevel = newData;
              const pathParts = arrayPath.split(".");
  
              pathParts.forEach((part, level) => {
                const idx = index[level];
  
                if (!currentLevel[part]) return;
  
                if (Array.isArray(currentLevel[part])) {
                  currentLevel[part] = currentLevel[part].map((item, i) => {
                    if (i === idx) {
                      if (level === pathParts.length - 1) {
                        return {
                          ...item,
                          [fieldName]: value ? "N/A" : "",
                        };
                      }
                      return { ...item };
                    }
                    return item;
                  });
                }
  
                currentLevel = currentLevel[part][idx];
              });
  
              return newData;
            });
          }, 100);
        };
  
        this.initializeSchema(setJsonSchema, formData);
        return {
          "ui:order": ["has_related_party", "related_party", "account_info"],
          account_info: {
            "ui:widget": "hidden",
          },
          has_related_party: {
            "ui:options": {
              onChange: (value) => {
                this.nationalityChanged = true;
                this.dropdownReset({ has_related_party: value });
              },
            },
          },
          related_party: {
            "ui:options": {
              addable: !(
                this.form_status?.includes("review") ||
                this.form_status?.includes("approval")
              ),
              orderable: false,
              removable: !(
                this.form_status?.includes("review") ||
                this.form_status?.includes("approval")
              ),
            },
  
            items: {
              "ui:order": [
                "designation",
                "related_party_detail",
                "has_cif",
                "cif_number",
                "cif_enquiry",
                "has_document",
                "nationality",
  
                "customer_type_id",
                "constitution_code_id",
                "customer_status",
                "first_name",
                "middle_name",
                "last_name",
                "last_name_not_available",
                "father_name",
                "date_of_birth_ad",
                "date_of_birth_bs",
                "dedup_identification",
                "dedup_id_number",
                "extra_gap",
                "dedup_check",
                "dedup_module_data",
  
                "salutation",
                "gender",
                "marital_status",
                "email",
                "email_not_available",
                "family_account_holder",
                "relation_with_account_holder",
                "family_information",
                "permanent_country",
                "permanent_province",
                "permanent_district",
                "permanent_municipality",
                "permanent_ward_number",
                "permanent_street_name",
                "permanent_town",
                "permanent_house_number",
                "permanent_outside_town",
                "permanent_outside_street_name",
                "permanent_postal_code",
                "same_as_permanent",
                "current_country",
                "current_province",
                "current_district",
                "current_municipality",
                "current_ward_number",
                "current_street_name",
                "current_town",
                "current_house_number",
                "current_outside_town",
                "current_outside_street_name",
                "contact_type",
                "mobile_country_code",
                "mobile_number",
                "phone_country_code",
                "phone_number",
                "id_type_details",
                "id_type_id",
                "identification_number",
                "issue_country",
                "occupation_type",
                "source_of_income",
                "occupation_detail",
                "pep",
                "pep_category",
                "pep_declaration",
                "family_pep_declaration",
                "adverse_media",
                "adverse_category",
                "entitled_with_fund",
                "customer_account_status",
                "loan_status",
                "is_blacklisted",
                "customer_business_involvement",
  
                "personal_info_screening",
                "personal_screening_data",
                "risk_level",
                "risk_score",
                "calculate_risk",
              ],
              relation_with_account_holder: {
                "ui:options": {
                  setDisabled: (formData, index) => {
                    setTimeout(
                      () =>
                        this.setFormData((prev) => ({
                          ...prev,
                          related_party: prev?.related_party?.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  relation_with_account_holder:
                                    item?.designation === "Mandatee"
                                      ? "75e7f733-e74c-4e02-8c73-494422b79e9f"
                                      : "6b1cf6bb-5644-4a66-aa6f-db1063ccae07",
                                }
                              : item
                          ),
                        })),
                      100
                    );
  
                    return true;
                  },
                },
              },
              has_cif: {
                "ui:widget": "CustomCheckBoxWidget",
                "ui:label": false,
              },
              connectedPairs: [
                ["last_name", "last_name_not_available"],
                ["email", "email_not_available"],
              ],
              same_as_permanent: {
                "ui:widget": "CustomCheckBoxWidget",
                "ui:label": false,
                "ui:options": {
                  onChange: (value, index) =>
                    sameAsPermanentOnChange(value, index ?? 0),
                },
              },
              calculate_risk: {
                "ui:widget": this.form_status?.includes("init")
                  ? "ButtonField"
                  : "hidden",
                "ui:label": false,
                "ui:classNames":
                  "d-flex flex-column justify-content-center mt-5 h-100",
                "ui:options": {
                  disableButton: (formData) => {
                    let requiredFields = jsonSchema.required || [];
                    const allFilled = requiredFields.every((field) => {
                      const value = formData?.[field];
                      return (
                        value !== undefined && value !== null && value !== ""
                      );
                    });
  
                    return this.form_status?.includes("init") && !allFilled;
                  },
                  onClick: (index) => {
                    this.calculateRisk(index ?? 0);
                  },
                },
              },
              designation: {
                "ui:options": {
                  onChange: (value, index) => {
                    this.nationalityChanged = true;
                    this.dropdownReset(
                      { designation: value },
                      "related_party",
                      index
                    );
                  },
                },
              },
  
              dedup_identification: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    if (
                      formData?.related_party?.[index ?? 0]
                        ?.dedup_identification &&
                      this.nationalityChanged === true
                    ) {
                      this.convertToArray(
                        formData?.related_party?.[index ?? 0]
                          ?.dedup_identification,
                        "id_type_id",
                        "id_type_details",
                        ["dedup_identification", "id_type_id"]
                      );
  
                      this.nationalityChanged = false;
                    }
  
                    const d = this.functionGroup?.getRequiredDocuments(
                      this.optionsData["multi_validation_mapping"],
                      {
                        nationality:
                          formData?.related_party?.[index ?? 0]?.nationality,
                        account_type: formData?.account_info,
                      }
                    );
  
                    return d;
                  },
  
                  onChange: (value, index) => {
                    this.convertToArray(
                      value,
                      "id_type_id",
                      "id_type_details",
                      ["dedup_identification", "id_type_id"],
                      index ?? 0,
                      "related_party"
                    );
                    // setTimeout(
                    //   () =>
                    //     this.setFormData((prev) => ({
                    //       ...prev,
                    //       related_party: prev?.related_party?.map((item, idx) =>
                    //         idx === index
                    //           ? {
                    //               ...item,
                    //               nationality:
                    //                 prev?.dedup_identification ===
                    //                 "4fcd4a69-59f3-4de2-986f-c56e07d223cd"
                    //                   ? "1d21f625-d93f-11ef-aac3-02420a004606"
                    //                   : "9c0c15a4-c05c-4355-a880-4c9798543152",
                    //             }
                    //           : item
                    //       ),
                    //     })),
                    //   100
                    // );
                  },
                },
              },
              customer_type_id: {
                "ui:widget": "CascadeDropdown",
  
                "ui:options": {
                  getOptions: (formData, index) => {
                    return this.filterOptionsCustomer(
                      "customer_type_relation",
                      !formData?.related_party?.[index]?.has_cif &&
                        formData?.related_party?.[index]?.nationality
                    );
                  },
                  onChange: (value, index) => {
                    return this.dropdownReset(
                      {
                        customer_type_id: value,
                        constitution_code_id: null,
                      },
                      "related_party",
                      index ?? 0
                    );
                  },
                },
              },
  
              constitution_code_id: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    const d = this.functionGroup?.getRequiredDocuments(
                      this.optionsData["multi_validation_mapping"],
                      {
                        nationality:
                          formData?.related_party?.[index]?.nationality,
                        customer_type_id:
                          this.formData?.related_party?.[index]
                            ?.customer_type_id ??
                          formData?.related_party?.[index]?.customer_type_id,
                      },
                      "constitution_code_id"
                    );
  
                    return d;
                  },
                },
              },
  
              nationality: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData) => {
                    return this.filterOptions("nationalities");
                  },
                  onChange: (value, index) => {
                    this.nationalityChanged = true;
                    return this.dropdownReset(
                      {
                        nationality: value,
                        dedup_identification:
                          value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                            ? "2f256727-f8a0-4e50-b1e0-42bef3b0d5a1"
                            : null,
                        permanent_country:
                          value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                            ? "79f0a217-d50c-4bc6-a509-8a300f9a30c2"
                            : this.formData?.permanent_country,
                        id_type_details: [{}],
                        customer_type_id: null,
                        constitution_code_id: null,
                      },
                      "related_party",
                      index ?? 0
                    );
                  },
                },
              },
  
              dedup_id_number: {
                "ui:options": {
                  onChange: (value, index) => {
                    this.convertToArray(
                      value,
                      "identification_number",
                      "id_type_details",
                      ["dedup_identification", "id_type_id"],
                      index ?? 0,
                      "related_party"
                    );
                  },
                },
              },
              father_name: {
                "ui:options": {
                  onChange: (value, index) => {
                    this.convertToArray(
                      value,
                      "family_member_full_name",
                      "family_information",
                      null,
                      index ?? 0,
                      "related_party"
                    );
                  },
                },
              },
              dedup_check: {
                "ui:widget": this.form_status?.includes("init")
                  ? "ButtonField"
                  : "hidden",
                "ui:label": false,
                "ui:classNames":
                  "d-flex justify-content-end align-items-end h-100 my-1",
                "ui:options": {
                  disableButton: (formData, index) =>
                    !formData?.related_party?.[index]?.first_name?.trim(),
                  onClick: (index) => {
                    this.getDedupCheck(index ?? 0);
                  },
                },
              },
              dedup_module_data: {
                "ui:widget": "ScreeningReportCard",
                "ui:label": false,
                showCheckbox: false,
                showViewedColumn: false,
                // showActionText: true,
                fixedActionsColumn: true,
                "ui:options": {
                  onCheckboxChange: (tableData, category, checked) => {
                    this.setFormData((prevData) => ({
                      ...prevData,
                      [category]: checked ? "Yes" : "No",
                      dedup_module_data: tableData,
                    }));
                  },
                  actionHandlers: {
                    view: (record) => setIsModalVisible(true),
                    match: (record, index) =>
                      this.fetchRelatedPartyEnquiry(
                        index ?? 0,
                        record?.cif_number
                      ),
                  },
                },
              },
  
              family_information: {
                "ui:widget": "EditableTableWidget",
                "ui:label": false,
                "ui:options": {
                  addable: false,
                  orderable: false,
                  removable: false,
                  fieldKeys: ["family_member_relation"],
                  disableSpecificKeys: this.form_status.includes("init")
                    ? [
                        { family_member_relation: 0 },
                        { family_member_relation: 1 },
                        { family_member_relation: 2 },
                      ]
                    : [
                        {
                          family_member_relation: 0,
                          family_member_full_name: 0,
                          is_family_name_not_available: 0,
                        },
                        {
                          family_member_relation: 1,
                          family_member_full_name: 1,
                          is_family_name_not_available: 1,
                        },
                        {
                          family_member_relation: 2,
                          family_member_full_name: 2,
                          is_family_name_not_available: 2,
                        },
                      ],
                },
                items: {
                  "ui:ObjectFieldTemplate": ObjectFieldTemplate,
                  family_member_relation: {
                    "ui:placeholder": "Select Relationship",
                    "ui:disabled": true,
                  },
  
                  family_member_full_name: {
                    "ui:placeholder": "Enter Full Name",
                    "ui:options": {
                      setDisabled: (formData, index) =>
                        this.form_status.includes("init") ||
                        this.form_status.includes("update")
                          ? (formData?.related_party?.[index[0]]
                              ?.family_information?.[index[1]]
                              ?.family_member_relation ===
                              "66a40508-67f6-4303-9f88-8537ff195007" &&
                              formData?.related_party?.[index[0]]?.father_name) ||
                            formData?.related_party?.[index[0]]
                              ?.family_information?.[index[1]]
                              ?.is_family_name_not_available
                          : true,
                    },
                  },
  
                  is_family_name_not_available: {
                    "ui:widget": "CustomCheckBoxWidget",
                    "ui:options": {
                      setDisabled: (formData, index) =>
                        formData?.related_party?.[index[0]]?.family_information?.[
                          index[1]
                        ]?.family_member_relation ===
                          "66a40508-67f6-4303-9f88-8537ff195007" &&
                        formData?.related_party?.[index[0]]?.father_name !== ""
                          ? true
                          : false,
  
                      onChange: (value, index) => {
                        this.familyNameChange(
                          "family_member_full_name",
                          value,
                          "related_party.family_information",
                          index ?? 0
                        );
                      },
                    },
                  },
                },
              },
  
              gender: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    return this.filterOptions(
                      "genders",
                      formData?.related_party &&
                        formData?.related_party?.[index]?.salutation
                    );
                  },
                },
              },
              last_name_not_available: {
                "ui:widget": "CustomCheckBoxWidget",
                "ui:label": false,
  
                "ui:options": {
                  onChange: (value, index) => {
                    handleLastNameNotAvailableChange(
                      "last_name",
                      value,
                      "related_party",
                      index ?? 0
                    );
                  },
                },
              },
              email_not_available: {
                "ui:widget": "CustomCheckBoxWidget",
                "ui:label": false,
                "ui:options": {
                  onChange: (value, index) => {
                    handleEmailNotAvailableChange(
                      "email",
                      value,
                      "related_party",
                      index ?? 0
                    );
                  },
                },
              },
              date_of_birth_ad: {
                "ui:widget": widgets.CustomDatePicker,
                "ui:placeholder": "Select Date of Birth (A.D)",
                "ui:options": {
                  name: "date_of_birth_ad",
                  enforceAgeRestriction: true,
                  validAge: 18,
                  onDateChange: (selectedDate, index) => {
                    this.convertDateSingle(
                      selectedDate,
                      setFormData,
                      true,
                      "date_of_birth_ad",
                      "related_party",
                      index ? index : 0
                    );
                  },
                },
              },
              date_of_birth_bs: {
                "ui:widget": widgets.NepaliDatePickerR,
                "ui:options": {
                  enforceAgeRestriction: true,
                  name: "date_of_birth_bs",
                  validAge: 18,
                  onDateChange: (selectedDate, index) => {
                    this.convertDateSingle(
                      selectedDate,
                      setFormData,
                      false,
                      "date_of_birth_bs",
                      "related_party",
                      index ? index : 0
                    );
                  },
                },
              },
  
              id_type_details: {
                "ui:options": {
                  addable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval")
                  ),
                  orderable: false,
                  removable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval")
                  ),
                },
                items: {
                  "ui:order": [
                    "id_type_id",
                    "identification_number",
                    "issue_country",
                    "issued_district",
                    "issued_district_text",
                    "issuing_authority",
                    "issuing_authority_text",
                    "id_issued_date_ad",
                    "id_issued_date_bs",
                    "id_expiry_date_ad",
                    "id_expiry_date_bs",
                    "visa_issued_date_ad",
                    "visa_expiry_date_ad",
                    "visa_type",
                    "national_id_number",
                    "comment",
                    "citizenship_number",
                  ],
  
                  id_type_id: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        const d = this.functionGroup?.getRequiredDocuments(
                          this.optionsData["multi_validation_mapping"],
                          {
                            nationality:
                              formData?.related_party?.[index[0] ?? index ?? 0]
                                ?.nationality,
                            account_type: formData?.account_info,
                          }
                        );
  
                        return d;
                      },
                    },
                  },
                  issue_country: {
                    "ui:options": {
                      setDisabled: (formData, index) =>
                        formData?.related_party?.[index]?.nationality ===
                        "9c0c15a4-c05c-4355-a880-4c9798543152",
                    },
                  },
                  comment: {
                    "ui:widget": "textarea",
                    "ui:options": {
                      rows: 5,
                    },
                  },
                  id_issued_date_ad: {
                    "ui:widget": widgets.CustomDatePicker,
                    "ui:placeholder": "Select Issued Date (A.D)",
                    "ui:options": {
                      name: "id_issued_date_ad",
                      enforceAgeRestriction: false,
                      validAge: 0,
                      disableFutureDates: true,
                      minimumDate: (formData, index) => {
                        const minDateValue = formData?.related_party[
                          index[0]
                        ]?.id_type_details?.map((item) =>
                          this.moment(
                            formData?.related_party?.[index[0]]?.date_of_birth_ad
                          )
                            .add(16, "years")
                            .format("YYYY-MM-DD")
                        );
                        return minDateValue && minDateValue[0];
                      },
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          true,
                          index,
                          "id_issued_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
  
                  id_issued_date_bs: {
                    "ui:widget": widgets.NepaliDatePickerR,
                    "ui:options": {
                      enforceAgeRestriction: true,
                      name: "id_issued_date_bs",
                      disableFutureDates: true,
                      minimumDate: (formData, index) => {
                        const minDateValue = formData?.related_party[
                          index[0]
                        ]?.id_type_details?.map((item) =>
                          this.NepaliDate.parseEnglishDate(
                            this.moment(
                              formData?.related_party?.[index[0]]
                                ?.date_of_birth_ad
                            )
                              .add(16, "years")
                              .format("YYYY-MM-DD"),
                            "YYYY-MM-DD"
                          ).format("YYYY-MM-DD")
                        );
                        return minDateValue && minDateValue[0];
                      },
  
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          false,
                          index,
                          "id_issued_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
  
                  id_expiry_date_ad: {
                    "ui:widget": widgets.CustomDatePicker,
                    "ui:placeholder": "Select Issued Date (A.D)",
                    "ui:options": {
                      name: "id_expiry_date_ad",
                      enforceAgeRestriction: false,
                      validAge: 0,
                      enableFutureDates: true,
  
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          true,
                          index,
                          "id_expiry_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
                  id_expiry_date_bs: {
                    "ui:widget": widgets.NepaliDatePickerR,
                    "ui:options": {
                      validAge: 0,
                      enforceAgeRestriction: true,
                      name: "id_expiry_date_bs",
                      enableFutureDates: true,
  
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          false,
                          index,
                          "id_expiry_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
  
                  issuing_authority: {
                    "ui:options": {
                      setValue: (formData, index) => {
                        const document_types = {
                          citizenship_number:
                            "2f256727-f8a0-4e50-b1e0-42bef3b0d5a1",
                          passport: "4dc4c231-ca03-4148-9167-04e4404cc970",
                          driving_license: "b30feb72-988d-4bca-8b1a-f41f7cf52462",
                          voter_id: "d33cd0aa-896f-40d3-9c61-cacd8ff84f3f",
                          nid: "ce66bc73-158b-42e5-b445-095c193d0137",
                        };
                        const issuing_authorities = {
                          citizenship_number:
                            "afbbc41c-1ff4-4e5b-a12f-ae1424853138",
                          passport: "afbbc41c-1ff4-4e5b-a12f-ae1424853138",
                          driving_license: "2fc650d7-3fe4-408a-89cb-553e7639fab0",
                          voter_id: "a4e3fa6d-133d-40da-8996-444207b7f2a2",
                          nid: "f9254205-8b66-44ca-9e75-1145a1130c78",
                        };
  
                        const currentIdType =
                          formData?.related_party?.[index[0]]?.id_type_details?.[
                            index[1]
                          ]?.id_type_id;
  
                        const matchingDocType = Object.entries(
                          document_types
                        ).find(([_, value]) => value === currentIdType);
  
                        if (matchingDocType) {
                          const [docTypeKey] = matchingDocType;
                          setFormData((prev) => ({
                            ...prev,
                            related_party: prev?.related_party?.map((item, idx) =>
                              idx === index[0]
                                ? {
                                    ...item,
                                    issuing_authority:
                                      issuing_authorities[docTypeKey],
                                  }
                                : item
                            ),
                          }));
  
                          return issuing_authorities[docTypeKey];
                        }
  
                        return null;
                      },
                    },
                  },
                  issued_district: {
                    "ui:placeholder": "Select Place of Issue",
                  },
                  visa_issued_date_ad: {
                    "ui:placeholder": "Select Visa Issued Date (A.D)",
                    "ui:options": {
                      enforceAgeRestriction: false,
                      minDate: 0,
                      disableFutureDates: true,
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          true,
                          index,
                          "related_party_visa_issued_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
                  visa_expiry_date_ad: {
                    "ui:placeholder": "Select Visa Expiry Date (A.D)",
                    "ui:options": {
                      enforceAgeRestriction: false,
                      minDate: 0,
                      enableFutureDates: true,
                      onDateChange: (selectedDate, index) => {
                        this.convertDate(
                          selectedDate,
                          setFormData,
                          true,
                          index,
                          "related_party_visa_expiry_date",
                          "related_party.id_type_details"
                        );
                      },
                    },
                  },
                  visa_type: {
                    "ui:placeholder": "Select Visa Type",
                  },
                },
              },
  
              current_country: {
                "ui:widget": "hidden",
              },
  
              current_province: {
                "ui:widget": "hidden",
              },
  
              current_district: {
                "ui:widget": "hidden",
              },
              current_municipality: {
                "ui:widget": "hidden",
              },
              current_ward_number: {
                "ui:widget": "hidden",
              },
              current_street_name: {
                "ui:widget": "hidden",
              },
              current_town: {
                "ui:widget": "hidden",
              },
              current_house_number: {
                "ui:widget": "hidden",
              },
              current_outside_town: {
                "ui:widget": "hidden",
              },
              current_outside_street_name: {
                "ui:widget": "hidden",
              },
  
              salutation: {
                "ui:widget": "CustomRadioWidget",
                "ui:label": false,
                "ui:options": {
                  getOptions: (formData) => {
                    return this.filterOptions(
                      "salutations",
                      formData?.account_info
                    );
                  },
                  onChange: (value, index) => {
                    this.dropdownReset(
                      {
                        salutation: value,
                        gender: "",
                      },
                      "related_party",
                      index ?? 0
                    );
                  },
                },
              },
  
              cif_enquiry: {
                "ui:widget": "ButtonField",
                "ui:label": false,
                "ui:classNames": "d-flex h-100 mt-5 align-items-center",
                "ui:options": {
                  disableButton: (formData, index) =>
                    !formData?.related_party?.[index]?.cif_number?.trim(),
  
                  onClick: (index) => {
                    this.fetchRelatedPartyEnquiry(index ?? 0);
                  },
                },
              },
              personal_screening_data: {
                "ui:widget": "ScreeningReportCard",
                "ui:label": false,
                showCheckbox: true,
                showActionText: true,
                fixedActionsColumn: true,
                "ui:options": {
                  onCheckboxChange: (tableData, category, index) =>
                    this.setFormData((prevData) => ({
                      ...prevData,
                      related_party: prevData?.related_party?.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              [category]: true ? "Yes" : "No",
                              personal_screening_data: tableData,
                            }
                          : item
                      ),
                    })),
  
                  actionHandlers: {
                    view: (record) => setIsModalVisible(true),
                  },
                },
              },
              personal_info_screening: {
                "ui:widget": "ButtonField",
                "ui:label": false,
                "ui:options": {
                  disableButton: (formData, index) =>
                    !formData?.related_party?.[index]?.first_name?.trim(),
                  onClick: (index) => {
                    this.fetchRelatedPartyInfoScreening(index ?? 0);
                  },
                },
              },
              permanent_province: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    return this.filterOptions("provinces");
                  },
                  onChange: (value, index) =>
                    this.dropdownReset(
                      {
                        permanent_province: value,
                        permanent_district: null,
                        permanent_municipality: null,
                        permanent_ward_number: "",
                        permanent_street_name: "",
                        permanent_town: "",
                        permanent_house_number: "",
                      },
                      "related_party",
                      index ?? 0
                    ),
                },
              },
  
              permanent_district: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    return this.filterOptions(
                      "districts",
                      formData.related_party &&
                        formData.related_party?.[index]?.permanent_province
                    );
                  },
                  onChange: (value, index) =>
                    this.dropdownReset(
                      {
                        permanent_district: value,
                        permanent_municipality: null,
                        permanent_ward_number: "",
                        permanent_street_name: "",
                        permanent_town: "",
                        permanent_house_number: "",
                      },
                      "related_party",
                      index ?? 0
                    ),
                },
              },
  
              permanent_municipality: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: (formData, index) => {
                    return this.filterOptions(
                      "local_bodies",
                      formData.related_party &&
                        formData.related_party?.[index]?.permanent_district
                    );
                  },
                  onChange: (value, index) =>
                    this.dropdownReset(
                      {
                        permanent_municipality: value,
                        permanent_ward_number: "",
                        permanent_street_name: "",
                        permanent_town: "",
                        permanent_house_number: "",
                      },
                      "related_party",
                      index ?? 0
                    ),
                },
              },
  
              occupation_type: {
                "ui:widget": "CascadeDropdown",
                "ui:options": {
                  getOptions: () => this.filterOptions("occupations"),
                  onChange: (value, index) =>
                    this.dropdownReset(
                      {
                        occupation_type: value,
                        source_of_income: null,
                      },
                      "related_party",
                      index
                    ),
                },
              },
  
              occupation_detail: {
                "ui:classNames": "my-1",
                "ui:options": {
                  addable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval") ||
                    this.form_status?.includes("Completed")
                  ),
                  orderable: false,
                  removable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval") ||
                    this.form_status?.includes("Completed")
                  ),
                },
                items: {
                  designation: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: () => this.filterOptions("corporate_relation"),
                    },
                  },
                },
              },
  
              related_party_detail: {
                "ui:options": {
                  addable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval")
                  ),
                  orderable: false,
                  removable: !(
                    this.form_status?.includes("review") ||
                    this.form_status?.includes("approval")
                  ),
                },
                items: {
                  "ui:order": [
                    "designation",
                    "related_party_detail",
                    "has_cif",
                    "cif_number",
                    "cif_enquiry",
                    "has_document",
                    "nationality",
  
                    "customer_type_id",
                    "constitution_code_id",
                    "customer_status",
                    "first_name",
                    "middle_name",
                    "last_name",
                    "last_name_not_available",
                    "father_name",
                    "date_of_birth_ad",
                    "date_of_birth_bs",
                    "dedup_identification",
                    "dedup_id_number",
                    "extra_gap",
                    "dedup_check",
                    "dedup_module_data",
  
                    "salutation",
                    "gender",
                    "marital_status",
                    "email",
                    "email_not_available",
                    "family_account_holder",
                    "relation_with_account_holder",
                    "family_information",
                    "permanent_country",
                    "permanent_province",
                    "permanent_district",
                    "permanent_municipality",
                    "permanent_ward_number",
                    "permanent_street_name",
                    "permanent_town",
                    "permanent_house_number",
                    "permanent_outside_town",
                    "permanent_outside_street_name",
                    "permanent_postal_code",
                    "same_as_permanent",
                    "current_country",
                    "current_province",
                    "current_district",
                    "current_municipality",
                    "current_ward_number",
                    "current_street_name",
                    "current_town",
                    "current_house_number",
                    "current_outside_town",
                    "current_outside_street_name",
                    "contact_type",
                    "mobile_country_code",
                    "mobile_number",
                    "phone_country_code",
                    "phone_number",
                    "id_type_details",
                    "id_type_id",
                    "identification_number",
                    "issue_country",
                    "occupation_type",
                    "source_of_income",
                    "occupation_detail",
                    "pep",
                    "pep_category",
                    "pep_declaration",
                    "family_pep_declaration",
                    "adverse_media",
                    "adverse_category",
                    "entitled_with_fund",
                    "customer_account_status",
                    "existing_risk_rating",
                    "loan_status",
                    "is_blacklisted",
                    "customer_business_involvement",
                    "personal_info_screening",
                    "personal_screening_data",
                    "risk_level",
                    "risk_score",
                    "calculate_risk",
                  ],
                  "ui:ObjectFieldTemplate": ObjectFieldTemplate,
                  customer_type_id: {
                    "ui:widget": "CascadeDropdown",
  
                    "ui:options": {
                      getOptions: (formData, index) => {
                        return this.filterOptionsCustomer(
                          "customer_type_relation",
                          !formData?.related_party?.[index[0]]
                            ?.related_party_detail?.[index[1]]?.has_cif &&
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail?.[index[1]]?.nationality
                        );
                      },
                      onChange: (value, index) => {
                        return this.dropdownReset(
                          {
                            customer_type_id: value,
                            constitution_code_id: null,
                          },
                          "related_party",
                          index ?? 0
                        );
                      },
                    },
                  },
  
                  constitution_code_id: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        const d = this.functionGroup?.getRequiredDocuments(
                          this.optionsData["multi_validation_mapping"],
                          {
                            nationality:
                              formData?.related_party?.[index[0]]
                                ?.related_party_detail?.[index[1]]?.nationality,
                            customer_type_id:
                              this.formData?.related_party?.[index[0]]
                                ?.related_party_detail?.[index[1]]
                                ?.customer_type_id ??
                              formData?.related_party?.[index[0]]
                                ?.related_party_detail?.[index[1]]
                                ?.customer_type_id,
                          },
                          "constitution_code_id"
                        );
  
                        return d;
                      },
                    },
                  },
  
                  // nationality: {
                  //   "ui:widget": "CascadeDropdown",
                  //   "ui:options": {
                  //     getOptions: (formData) => {
                  //       return this.filterOptions("nationalities");
                  //     },
                  //     onChange: (value, index) => {
                  //       this.nationalityChanged = true;
                  //       return this.dropdownReset(
                  //         {
                  //           nationality: value,
                  //           dedup_identification:
                  //             value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                  //               ? "2f256727-f8a0-4e50-b1e0-42bef3b0d5a1"
                  //               : null,
                  //           permanent_country:
                  //             value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                  //               ? "79f0a217-d50c-4bc6-a509-8a300f9a30c2"
                  //               : this.formData?.permanent_country,
                  //           id_type_details: [{}],
                  //           customer_type_id: null,
                  //           constitution_code_id: null,
                  //         },
                  //         "related_party",
                  //         index ?? 0
                  //       );
                  //     },
                  //   },
                  // },
  
                  relation_with_account_holder: {
                    "ui:options": {
                      setDisabled: (formData, index) => {
                        setTimeout(
                          () =>
                            this.setFormData((prev) => ({
                              ...prev,
                              related_party: prev?.related_party?.map((item, i) =>
                                i === index[0]
                                  ? {
                                      ...item,
                                      related_party_detail:
                                        item?.related_party_detail?.map(
                                          (item2, i) =>
                                            i === index[1]
                                              ? {
                                                  ...item2,
                                                  relation_with_account_holder:
                                                    item?.designation ===
                                                    "Mandatee"
                                                      ? "75e7f733-e74c-4e02-8c73-494422b79e9f"
                                                      : "6b1cf6bb-5644-4a66-aa6f-db1063ccae07",
                                                }
                                              : item2
                                        ),
                                    }
                                  : item
                              ),
                            })),
  
                          100
                        );
  
                        return true;
                      },
                    },
                  },
                  has_cif: {
                    "ui:widget": "CustomCheckBoxWidget",
                    "ui:label": false,
                  },
                  calculate_risk: {
                    "ui:widget": this.form_status?.includes("init")
                      ? "ButtonField"
                      : "hidden",
                    "ui:label": false,
                    "ui:classNames":
                      "d-flex flex-column justify-content-center mt-5 h-100",
                    "ui:options": {
                      disableButton: (formData) => {
                        let requiredFields = jsonSchema.required || [];
                        const allFilled = requiredFields.every((field) => {
                          const value = formData?.[field];
                          return (
                            value !== undefined && value !== null && value !== ""
                          );
                        });
  
                        return this.form_status?.includes("init") && !allFilled;
                      },
                      onClick: (index) => {
                        this.calculateRiskOneLevel(index ?? [0, 0]);
                      },
                    },
                  },
                  same_as_permanent: {
                    "ui:widget": "CustomCheckBoxWidget",
                    "ui:label": false,
                    "ui:options": {
                      onChange: (value, index) =>
                        sameAsPermanentOnChangeMultiple(value, index ?? [0, 0]),
                    },
                  },
                  designation: {
                    "ui:options": {
                      onChange: (value, index) => {
                        this.nationalityChanged = true;
                        this.dropdownResetMultipleLayer(
                          { designation: value },
                          ["related_party", "related_party_detail"],
                          index
                        );
                      },
                    },
                  },
  
                  current_country: {
                    "ui:widget": "hidden",
                  },
  
                  current_province: {
                    "ui:widget": "hidden",
                  },
  
                  current_district: {
                    "ui:widget": "hidden",
                  },
                  current_municipality: {
                    "ui:widget": "hidden",
                  },
                  current_ward_number: {
                    "ui:widget": "hidden",
                  },
                  current_street_name: {
                    "ui:widget": "hidden",
                  },
                  current_town: {
                    "ui:widget": "hidden",
                  },
                  current_house_number: {
                    "ui:widget": "hidden",
                  },
                  current_outside_town: {
                    "ui:widget": "hidden",
                  },
                  current_outside_street_name: {
                    "ui:widget": "hidden",
                  },
                  connectedPairs: [
                    ["last_name", "last_name_not_available"],
                    ["email", "email_not_available"],
                  ],
  
                  dedup_identification: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        if (
                          formData?.related_party?.[index[0]]
                            ?.related_party_detail?.[index[1]]
                            ?.dedup_identification &&
                          this.nationalityChanged === true
                        ) {
                          this.convertToArrayMultiple(
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail?.[index[1]]
                              ?.dedup_identification,
                            "id_type_id",
                            "id_type_details",
                            ["dedup_identification", "id_type_id"],
                            index,
                            ["related_party", "related_party_detail"]
                          );
  
                          this.nationalityChanged = false;
                        }
  
                        const d = this.functionGroup?.getRequiredDocuments(
                          this.optionsData["multi_validation_mapping"],
                          {
                            nationality:
                              formData?.related_party?.[index[0]]
                                ?.related_party_detail[index[1]]?.nationality,
                            account_type: formData?.account_info,
                          }
                        );
  
                        return d;
                      },
  
                      onChange: (value, index) => {
                        this.convertToArrayMultiple(
                          value,
                          "id_type_id",
                          "id_type_details",
                          ["dedup_identification", "id_type_id"],
                          index,
                          ["related_party", "related_party_detail"]
                        );
                        // setTimeout(
                        //   () =>
                        //     this.setFormData((prev) => ({
                        //       ...prev,
                        //       related_party: prev?.related_party?.map(
                        //         (item, idx) =>
                        //           idx === index[0]
                        //             ? {
                        //                 ...item,
                        //                 related_party_detail:
                        //                   item?.related_party_detail?.map(
                        //                     (item, index2) =>
                        //                       index2 === index[1]
                        //                         ? {
                        //                             ...item,
                        //                             nationality:
                        //                               prev?.dedup_identification ===
                        //                               "4fcd4a69-59f3-4de2-986f-c56e07d223cd"
                        //                                 ? "1d21f625-d93f-11ef-aac3-02420a004606"
                        //                                 : "9c0c15a4-c05c-4355-a880-4c9798543152",
                        //                           }
                        //                         : item
                        //                   ),
                        //               }
                        //             : item
                        //       ),
                        //     })),
                        //   100
                        // );
                      },
                    },
                  },
  
                  dedup_id_number: {
                    "ui:options": {
                      onChange: (value, index) => {
                        this.convertToArrayMultiple(
                          value,
                          "identification_number",
                          "id_type_details",
                          ["dedup_identification", "id_type_id"],
                          index,
                          ["related_party", "related_party_detail"]
                        );
                      },
                    },
                  },
                  father_name: {
                    "ui:options": {
                      onChange: (value, index) => {
                        this.convertToArrayMultiple(
                          value,
                          "family_member_full_name",
                          "family_information",
                          null,
                          index,
                          ["related_party", "related_party_detail"]
                        );
                      },
                    },
                  },
                  dedup_check: {
                    "ui:widget": this.form_status?.includes("init")
                      ? "ButtonField"
                      : "hidden",
                    "ui:label": false,
                    "ui:classNames":
                      "d-flex justify-content-end align-items-end h-100 my-1",
                    "ui:options": {
                      disableButton: (formData, index) =>
                        !formData?.related_party?.[
                          index[0]
                        ]?.related_party_detail[index[1]]?.first_name?.trim(),
                      onClick: (index) => {
                        this.getDedupCheck(index ?? 0, true);
                      },
                    },
                  },
                  dedup_module_data: {
                    "ui:widget": "ScreeningReportCard",
                    "ui:label": false,
                    showCheckbox: false,
                    showViewedColumn: false,
                    // showActionText: true,
                    fixedActionsColumn: true,
                    "ui:options": {
                      onCheckboxChange: (tableData, category, checked) => {
                        this.setFormData((prevData) => ({
                          ...prevData,
                          [category]: checked ? "Yes" : "No",
                          dedup_module_data: tableData,
                        }));
                      },
                      actionHandlers: {
                        view: (record) => setIsModalVisible(true),
                        match: (record, index) =>
                          this.fetchRelatedPartyEnquiryMultipleLayer(
                            index ?? 0,
                            record?.cif_number
                          ),
                      },
                    },
                  },
                  nationality: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData) => {
                        return this.filterOptions("nationalities");
                      },
                      onChange: (value, index) => {
                        this.nationalityChanged = true;
                        return this.dropdownResetMultipleLayer(
                          {
                            nationality: value,
                            dedup_identification:
                              value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                                ? "2f256727-f8a0-4e50-b1e0-42bef3b0d5a1"
                                : null,
                            permanent_country:
                              value === "9c0c15a4-c05c-4355-a880-4c9798543152"
                                ? "79f0a217-d50c-4bc6-a509-8a300f9a30c2"
                                : this.formData?.permanent_country,
                            id_type_details: [{}],
                            customer_type_id: null,
                            constitution_code_id: null,
                          },
                          ["related_party", "related_party_detail"],
                          index ?? [0, 0]
                        );
                      },
                    },
                  },
                  family_information: {
                    "ui:widget": "EditableTableWidget",
                    "ui:label": false,
                    "ui:options": {
                      addable: false,
                      orderable: false,
                      removable: false,
                      fieldKeys: ["family_member_relation"],
                      disableSpecificKeys: this.form_status.includes("init")
                        ? [
                            { family_member_relation: 0 },
                            { family_member_relation: 1 },
                            { family_member_relation: 2 },
                          ]
                        : [
                            {
                              family_member_relation: 0,
                              family_member_full_name: 0,
                              is_family_name_not_available: 0,
                            },
                            {
                              family_member_relation: 1,
                              family_member_full_name: 1,
                              is_family_name_not_available: 1,
                            },
                            {
                              family_member_relation: 2,
                              family_member_full_name: 2,
                              is_family_name_not_available: 2,
                            },
                          ],
                    },
                    items: {
                      "ui:ObjectFieldTemplate": ObjectFieldTemplate,
                      family_member_relation: {
                        "ui:placeholder": "Select Relationship",
                        "ui:disabled": true,
                      },
                      family_member_full_name: {
                        "ui:placeholder": "Enter Full Name",
                        "ui:options": {
                          setDisabled: (formData, index) => {
                            return this.form_status.includes("init") ||
                              this.form_status.includes("update")
                              ? (formData?.related_party?.[index[0]]
                                  ?.related_party_detail?.[index[1]]
                                  ?.family_information?.[index[2]]
                                  ?.family_member_relation ===
                                  "66a40508-67f6-4303-9f88-8537ff195007" &&
                                  formData?.related_party?.[index[0]]
                                    ?.related_party_detail?.[index[1]]
                                    ?.father_name) ||
                                  formData?.related_party?.[index[0]]
                                    ?.related_party_detail?.[index[1]]
                                    ?.family_information?.[index[2]]
                                    ?.is_family_name_not_available
                              : true;
                          },
                        },
                      },
  
                      is_family_name_not_available: {
                        "ui:widget": "CustomCheckBoxWidget",
                        "ui:options": {
                          setDisabled: (formData, index) => {
                            return formData?.related_party?.[index?.[0]]
                              ?.related_party_detail?.[index?.[1]]
                              ?.family_information?.[index?.[2]]
                              ?.family_member_relation ===
                              "66a40508-67f6-4303-9f88-8537ff195007" &&
                              formData?.related_party?.[index?.[0]]
                                ?.related_party_detail?.[index?.[1]]?.father_name
                              ? true
                              : false;
                          },
                          onChange: (value, index) => {
                            this.familyNameChange(
                              "family_member_full_name",
                              value,
                              "related_party.related_party_detail.family_information",
                              index ?? 0
                            );
                          },
                        },
                      },
                    },
                  },
  
                  salutation: {
                    "ui:widget": "CustomRadioWidget",
                    "ui:label": false,
                    "ui:options": {
                      getOptions: (formData) => {
                        return this.filterOptions(
                          "salutations",
                          formData?.account_info
                        );
                      },
                      onChange: (value, index) => {
                        this.dropdownResetMultipleLayer(
                          {
                            salutation: value,
                            gender: "",
                          },
                          ["related_party", "related_party_detail"],
                          index ?? [0, 0]
                        );
                      },
                    },
                  },
                  gender: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        return this.filterOptions(
                          "genders",
                          formData?.related_party &&
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail &&
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail[index[1]]?.salutation
                        );
                      },
                    },
                  },
                  permanent_province: {
                    "ui:widget": "CascadeDropdown",
  
                    "ui:options": {
                      getOptions: (formData, index) => {
                        return this.filterOptions("provinces");
                      },
                      onChange: (value, index) =>
                        this.dropdownResetMultipleLayer(
                          {
                            permanent_province: value,
                            permanent_district: null,
                            permanent_municipality: null,
                            permanent_ward_number: "",
                            permanent_street_name: "",
                            permanent_town: "",
                            permanent_house_number: "",
                          },
                          ["related_party", "related_party_detail"],
                          index ?? [0, 0]
                        ),
                    },
                  },
                  permanent_district: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        return this.filterOptions(
                          "districts",
                          formData?.related_party &&
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail &&
                            formData.related_party?.[index[0]]
                              ?.related_party_detail[index[1]]?.permanent_province
                        );
                      },
                      onChange: (value, index) =>
                        this.dropdownReset(
                          {
                            permanent_district: value,
                            permanent_municipality: null,
                            permanent_ward_number: "",
                            permanent_street_name: "",
                            permanent_town: "",
                            permanent_house_number: "",
                          },
                          ["related_party", "related_party_detail"],
                          index
                        ),
                    },
                  },
  
                  permanent_municipality: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: (formData, index) => {
                        return this.filterOptions(
                          "local_bodies",
                          formData?.related_party &&
                            formData?.related_party?.[index[0]]
                              ?.related_party_detail &&
                            formData.related_party?.[index[0]]
                              ?.related_party_detail[index[1]]?.permanent_district
                        );
                      },
                      onChange: (value, index) =>
                        this.dropdownReset(
                          {
                            permanent_municipality: value,
                            permanent_ward_number: "",
                            permanent_street_name: "",
                            permanent_town: "",
                            permanent_house_number: "",
                          },
                          ["related_party", "related_party_detail"],
                          index
                        ),
                    },
                  },
  
                  date_of_birth_ad: {
                    "ui:widget": widgets.CustomDatePicker,
                    "ui:placeholder": "Select Date of Birth (A.D)",
                    "ui:options": {
                      name: "date_of_birth_ad",
                      enforceAgeRestriction: true,
                      validAge: 18,
                      onDateChange: (selectedDate, index) => {
                        this.convertDateSinglee(
                          selectedDate,
                          setFormData,
                          true,
                          "date_of_birth_ad",
                          "related_party.related_party_detail",
                          index
                        );
                      },
                    },
                  },
                  date_of_birth_bs: {
                    "ui:widget": widgets.NepaliDatePickerR,
                    "ui:options": {
                      enforceAgeRestriction: true,
                      name: "date_of_birth_bs",
                      validAge: 18,
                      onDateChange: (selectedDate, index) => {
                        this.convertDateSinglee(
                          selectedDate,
                          setFormData,
                          false,
                          "date_of_birth_bs",
                          "related_party.related_party_detail",
                          index
                        );
                      },
                    },
                  },
  
                  id_type_details: {
                    "ui:options": {
                      addable: !(
                        this.form_status?.includes("review") ||
                        this.form_status?.includes("approval")
                      ),
                      orderable: false,
                      removable: !(
                        this.form_status?.includes("review") ||
                        this.form_status?.includes("approval")
                      ),
                    },
                    items: {
                      "ui:order": [
                        "id_type_id",
                        "identification_number",
                        "issue_country",
                        "issued_district",
                        "issued_district_text",
                        "issuing_authority",
                        "issuing_authority_text",
                        "id_issued_date_ad",
                        "id_issued_date_bs",
                        "id_expiry_date_ad",
                        "id_expiry_date_bs",
  
                        "visa_issued_date_ad",
                        "visa_expiry_date_ad",
                        "visa_type",
                        "national_id_number",
                        "comment",
                        "citizenship_number",
                      ],
                      id_type_id: {
                        "ui:widget": "CascadeDropdown",
                        "ui:options": {
                          getOptions: (formData, index) => {
                            const d = this.functionGroup?.getRequiredDocuments(
                              this.optionsData["multi_validation_mapping"],
                              {
                                nationality:
                                  formData?.related_party?.[index?.[0]]
                                    ?.related_party_detail[index?.[1]]
                                    ?.nationality,
                                account_type: formData?.account_info,
                              }
                            );
  
                            return d;
                          },
                        },
                      },
                      issue_country: {
                        "ui:options": {
                          setDisabled: (formData, index) =>
                            formData?.related_party?.[index?.[0]]
                              ?.related_party_detail?.[index?.[1]]
                              ?.nationality ===
                            "9c0c15a4-c05c-4355-a880-4c9798543152",
                        },
                      },
                      comment: {
                        "ui:widget": "textarea",
                        "ui:options": {
                          rows: 5,
                        },
                      },
                      id_issued_date_ad: {
                        "ui:widget": widgets.CustomDatePicker,
                        "ui:placeholder": "Select Issued Date (A.D)",
                        "ui:options": {
                          name: "id_issued_date_ad",
  
                          enforceAgeRestriction: false,
                          validAge: 0,
                          disableFutureDates: true,
                          minimumDate: (formData, index) => {
                            const minDateValue = formData?.related_party[
                              index[0]
                            ]?.related_party_detail[
                              index[1]
                            ]?.id_type_details?.map((item) =>
                              this.moment(
                                formData?.related_party?.[index[0]]
                                  ?.related_party_detail[index[1]]
                                  ?.date_of_birth_ad
                              )
                                .add(16, "years")
                                .format("YYYY-MM-DD")
                            );
                            return minDateValue && minDateValue[0];
                          },
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              true,
                              index,
                              "id_issued_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
  
                      id_issued_date_bs: {
                        "ui:widget": widgets.NepaliDatePickerR,
                        "ui:options": {
                          enforceAgeRestriction: true,
                          name: "id_issued_date_bs",
                          disableFutureDates: true,
                          minimumDate: (formData, index) => {
                            const minDateValue = formData?.related_party[
                              index[0]
                            ]?.related_party_detail[
                              index[1]
                            ]?.id_type_details?.map((item) =>
                              this.NepaliDate.parseEnglishDate(
                                this.moment(
                                  formData?.related_party?.[index[0]]
                                    ?.related_party_detail[index[1]]
                                    ?.date_of_birth_ad
                                )
                                  .add(16, "years")
                                  .format("YYYY-MM-DD"),
                                "YYYY-MM-DD"
                              ).format("YYYY-MM-DD")
                            );
                            return minDateValue && minDateValue[0];
                          },
  
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              false,
                              index,
                              "id_issued_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
                      id_expiry_date_ad: {
                        "ui:widget": widgets.CustomDatePicker,
                        "ui:placeholder": "Select Expiry Date (A.D)",
                        "ui:options": {
                          minDate: 0,
                          name: "id_expiry_date_ad",
                          enforceAgeRestriction: true,
                          enableFutureDates: true,
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              true,
                              index,
                              "id_expiry_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
                      id_expiry_date_bs: {
                        "ui:widget": widgets.NepaliDatePickerR,
                        "ui:options": {
                          enforceAgeRestriction: true,
                          name: "id_expiry_date_bs",
                          enableFutureDates: true,
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              false,
                              index,
                              "id_expiry_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
                      issuing_authority: {
                        "ui:options": {
                          setValue: (formData, index) => {
                            const document_types = {
                              citizenship_number:
                                "2f256727-f8a0-4e50-b1e0-42bef3b0d5a1",
                              passport: "4dc4c231-ca03-4148-9167-04e4404cc970",
                              driving_license:
                                "b30feb72-988d-4bca-8b1a-f41f7cf52462",
                              voter_id: "d33cd0aa-896f-40d3-9c61-cacd8ff84f3f",
                              nid: "ce66bc73-158b-42e5-b445-095c193d0137",
                            };
                            const issuing_authorities = {
                              citizenship_number:
                                "afbbc41c-1ff4-4e5b-a12f-ae1424853138",
                              passport: "afbbc41c-1ff4-4e5b-a12f-ae1424853138",
                              driving_license:
                                "2fc650d7-3fe4-408a-89cb-553e7639fab0",
                              voter_id: "a4e3fa6d-133d-40da-8996-444207b7f2a2",
                              nid: "f9254205-8b66-44ca-9e75-1145a1130c78",
                            };
  
                            const currentIdType =
                              formData?.related_party?.[index[0]]
                                ?.related_party_detail[index[1]]
                                ?.id_type_details?.[index[2]]?.id_type_id;
  
                            const matchingDocType = Object.entries(
                              document_types
                            ).find(([_, value]) => value === currentIdType);
  
                            if (matchingDocType) {
                              const [docTypeKey] = matchingDocType;
                              setFormData((prev) => ({
                                ...prev,
                                related_party: prev?.related_party?.map(
                                  (item, idx) =>
                                    idx === index[0]
                                      ? {
                                          ...item,
                                          related_party_detail:
                                            item?.related_party_detail?.map(
                                              (data, idx2) =>
                                                idx2 === index[1]
                                                  ? {
                                                      ...data,
                                                      issuing_authority:
                                                        issuing_authorities[
                                                          docTypeKey
                                                        ],
                                                    }
                                                  : data
                                            ),
                                        }
                                      : item
                                ),
                              }));
  
                              return issuing_authorities[docTypeKey];
                            }
  
                            return null;
                          },
                        },
                      },
                      issued_district: {
                        "ui:placeholder": "Select Place of Issue",
                      },
                      visa_issued_date_ad: {
                        "ui:placeholder": "Select Visa Issued Date (A.D)",
                        "ui:options": {
                          enforceAgeRestriction: false,
                          minDate: 0,
                          disableFutureDates: true,
  
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              true,
                              index,
                              "visa_issued_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
                      visa_expiry_date_ad: {
                        "ui:placeholder": "Select Visa Expiry Date (A.D)",
                        "ui:options": {
                          enforceAgeRestriction: false,
                          enableFutureDates: true,
                          onDateChange: (selectedDate, index) => {
                            this.convertDate(
                              selectedDate,
                              setFormData,
                              true,
                              index,
                              "visa_expiry_date",
                              "related_party.related_party_detail.id_type_details"
                            );
                          },
                        },
                      },
                      visa_type: {
                        "ui:placeholder": "Select Visa Type",
                      },
                    },
                  },
                  last_name_not_available: {
                    "ui:widget": "CustomCheckBoxWidget",
                    "ui:label": false,
                    "ui:options": {
                      onChange: (value, index) => {
                        ChangeFiledToDot(
                          "last_name",
                          value,
                          "related_party.related_party_detail",
                          index
                        );
                      },
                    },
                  },
                  email_not_available: {
                    "ui:widget": "CustomCheckBoxWidget",
                    "ui:label": false,
                    "ui:options": {
                      onChange: (value, index) => {
                        ChangeFiledToDot(
                          "email",
                          value,
                          "related_party.related_party_detail",
                          index
                        );
                      },
                    },
                  },
  
                  cif_enquiry: {
                    "ui:widget": "ButtonField",
                    "ui:label": false,
                    "ui:classNames": "d-flex h-100 mt-5 align-items-center",
                    "ui:options": {
                      disableButton: (formData, index) => {
                        return !formData?.related_party?.[
                          index?.[0]
                        ]?.related_party_detail?.[index?.[1]]?.cif_number?.trim();
                      },
                      onClick: (index) => {
                        this.fetchRelatedPartyEnquiryMultipleLayer(
                          index ? index : 0
                        );
                      },
                    },
                  },
                  personal_screening_data: {
                    "ui:widget": "ScreeningReportCard",
                    "ui:label": false,
  
                    showCheckbox: true,
                    showActionText: true,
                    fixedActionsColumn: true,
                    "ui:options": {
                      onCheckboxChange: (tableData, category, index) =>
                        this.setFormData((prevData) => ({
                          ...prevData,
                          related_party: prevData?.related_party?.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  [category]: true ? "Yes" : "No",
                                  personal_screening_data: tableData,
                                }
                              : item
                          ),
                        })),
  
                      actionHandlers: {
                        view: (record) => setIsModalVisible(true),
                      },
                    },
                  },
                  personal_info_screening: {
                    "ui:widget": "ButtonField",
                    "ui:label": false,
                    "ui:classNames": "my-2",
                    "ui:options": {
                      disableButton: (formData, index) => {
                        return !formData?.related_party?.[
                          index?.[0]
                        ]?.related_party_detail?.[index?.[1]]?.first_name?.trim();
                      },
                      onClick: (index) => {
                        this.fetchRelatedPartyInfoScreeningMultipleLayer(
                          index ?? 0
                        );
                      },
                    },
                  },
  
                  occupation_type: {
                    "ui:widget": "CascadeDropdown",
                    "ui:options": {
                      getOptions: () => this.filterOptions("occupations"),
                      onChange: (value, index) =>
                        this.dropdownReset(
                          {
                            occupation_type: value,
                            source_of_income: null,
                          },
                          ["related_party", "related_party_detail"],
                          index
                        ),
                    },
                  },
  
                  occupation_detail: {
                    "ui:classNames": "my-1",
                    "ui:options": {
                      addable: !(
                        this.form_status?.includes("review") ||
                        this.form_status?.includes("approval") ||
                        this.form_status?.includes("Completed")
                      ),
                      orderable: false,
                      removable: !(
                        this.form_status?.includes("review") ||
                        this.form_status?.includes("approval") ||
                        this.form_status?.includes("Completed")
                      ),
                    },
                    items: {
                      designation: {
                        "ui:widget": "CascadeDropdown",
                        "ui:options": {
                          getOptions: () =>
                            this.filterOptions("corporate_relation"),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
      }
    }
  
    window.UISchemaFactory = UISchemaFactory;
  })();